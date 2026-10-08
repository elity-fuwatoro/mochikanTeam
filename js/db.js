/**
 * Mochikan - IndexedDB Database Module (db.js)
 * 外部ライブラリ依存ゼロのVanilla JS IndexedDBラッパー
 */

const DB_NAME = 'TeamPatientManagerDB';
const DB_VERSION = 1;

class PatientDB {
  constructor() {
    this.db = null;
  }

  /**
   * IndexedDBの初期化
   */
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 患者ストア
        if (!db.objectStoreNames.contains('patients')) {
          const patientStore = db.createObjectStore('patients', {
            keyPath: 'id',
            autoIncrement: true
          });
          patientStore.createIndex('status', 'status', { unique: false });
          patientStore.createIndex('room', 'room', { unique: false });
          patientStore.createIndex('nextVisitDate', 'nextVisitDate', { unique: false });
        }

        // 設定ストア
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * トランザクションとストアのヘルパー
   */
  _getStore(storeName, mode = 'readonly') {
    const tx = this.db.transaction(storeName, mode);
    return { tx, store: tx.objectStore(storeName) };
  }

  /**
   * 全患者データの取得
   */
  async getAllPatients() {
    await this.init();
    return new Promise((resolve, reject) => {
      const { store } = this._getStore('patients', 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * ステータス別の患者取得
   */
  async getPatientsByStatus(status) {
    await this.init();
    return new Promise((resolve, reject) => {
      const { store } = this._getStore('patients', 'readonly');
      const index = store.index('status');
      const request = index.getAll(status);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 患者1件の取得
   */
  async getPatient(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const { store } = this._getStore('patients', 'readonly');
      const request = store.get(Number(id));
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 患者の新規追加
   */
  async addPatient(patient) {
    await this.init();
    return new Promise((resolve, reject) => {
      const { tx, store } = this._getStore('patients', 'readwrite');
      const now = new Date().toISOString();

      // 一意な数値IDを必ず付与（autoIncrementの有無に関わらず確実に動作）
      const patientId = (patient.id && !isNaN(patient.id))
        ? Number(patient.id)
        : Date.now() + Math.floor(Math.random() * 1000);

      const newPatient = {
        ...patient,
        id: patientId,
        createdAt: patient.createdAt || now,
        updatedAt: now
      };

      const request = store.put(newPatient);
      request.onsuccess = () => resolve(newPatient.id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 患者の更新
   */
  async updatePatient(patient) {
    await this.init();
    return new Promise((resolve, reject) => {
      const { tx, store } = this._getStore('patients', 'readwrite');
      const updated = {
        ...patient,
        id: Number(patient.id),
        updatedAt: new Date().toISOString()
      };
      const request = store.put(updated);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 患者の削除
   */
  async deletePatient(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const { tx, store } = this._getStore('patients', 'readwrite');
      const request = store.delete(Number(id));
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 設定値の取得
   */
  async getSetting(key, defaultValue = null) {
    await this.init();
    return new Promise((resolve, reject) => {
      const { store } = this._getStore('settings', 'readonly');
      const request = store.get(key);
      request.onsuccess = () => {
        if (request.result && request.result.value !== undefined) {
          resolve(request.result.value);
        } else {
          resolve(defaultValue);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 設定値の保存
   */
  async setSetting(key, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const { tx, store } = this._getStore('settings', 'readwrite');
      const request = store.put({ key, value, updatedAt: new Date().toISOString() });
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 日替わり処理（カルテ記載チェック・レスキュー使用回数のリセット）
   * @param {string} todayStr "YYYY-MM-DD"
   * @returns {Promise<{resetOccurred: boolean, count: number}>}
   */
  async checkAndPerformDailyReset(todayStr) {
    await this.init();
    const lastOpenDate = await this.getSetting('lastAppOpenDate', null);

    // 同一日の場合は何もしない
    if (lastOpenDate === todayStr) {
      return { resetOccurred: false, count: 0 };
    }

    // 初回起動（lastOpenDateがnull）の場合は、本日の日付を記録してリセットは実行しない
    if (!lastOpenDate) {
      await this.setSetting('lastAppOpenDate', todayStr);
      return { resetOccurred: false, count: 0 };
    }

    // 日付が変わっているためリセットを実行
    const patients = await this.getAllPatients();
    let resetCount = 0;

    const { tx, store } = this._getStore('patients', 'readwrite');
    for (const patient of patients) {
      // カルテ記載チェック、診察予定チェック、またはレスキュー回数が残っている場合クリア
      if (patient.medicalRecordChecked || patient.examPlanned || (patient.rescueCount && patient.rescueCount > 0)) {
        patient.medicalRecordChecked = false;
        patient.examPlanned = false;
        patient.rescueCount = 0;
        patient.lastResetDate = todayStr;
        patient.updatedAt = new Date().toISOString();
        store.put(patient);
        resetCount++;
      }
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    await this.setSetting('lastAppOpenDate', todayStr);
    return { resetOccurred: true, count: resetCount };
  }

  /**
   * 全データのJSONエクスポート
   */
  async exportAllData() {
    await this.init();
    const patients = await this.getAllPatients();
    const settings = await new Promise((resolve, reject) => {
      const { store } = this._getStore('settings', 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    return {
      version: 1,
      appName: 'Mochikan',
      exportedAt: new Date().toISOString(),
      patients,
      settings
    };
  }

  /**
   * JSONデータのインポート
   * @param {Object} data 
   * @param {'merge'|'replace'} mode 
   */
  async importAllData(data, mode = 'merge') {
    await this.init();
    if (!data || !Array.isArray(data.patients)) {
      throw new Error('無効なデータ形式です。患者リストが見つかりません。');
    }

    const { tx, store } = this._getStore('patients', 'readwrite');

    if (mode === 'replace') {
      store.clear();
    }

    for (const p of data.patients) {
      const patient = { ...p };
      if (mode === 'merge' || !patient.id || isNaN(patient.id)) {
        // 重複防止または未定義防止のため、新規一意数値idを確実に割り振る
        patient.id = Date.now() + Math.floor(Math.random() * 100000);
      }
      patient.updatedAt = new Date().toISOString();
      store.put(patient);
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // 設定のインポート
    if (Array.isArray(data.settings)) {
      const { tx: sTx, store: sStore } = this._getStore('settings', 'readwrite');
      for (const s of data.settings) {
        if (s.key && s.value !== undefined) {
          sStore.put(s);
        }
      }
      await new Promise((resolve, reject) => {
        sTx.oncomplete = () => resolve();
        sTx.onerror = () => reject(sTx.error);
      });
    }

    return true;
  }

  /**
   * 全データ消去（初期化）
   */
  async clearAll() {
    await this.init();
    const { store } = this._getStore('patients', 'readwrite');
    store.clear();
  }

  /**
   * デモ・サンプルデータの投入
   */
  async loadSampleData() {
    await this.init();
    const today = new Date().toISOString().split('T')[0];
    const pastDate = (daysAgo) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };
    const futureDate = (daysLater) => {
      const d = new Date();
      d.setDate(d.getDate() + daysLater);
      return d.toISOString().split('T')[0];
    };

    const samples = [
      {
        room: '102A',
        name: '佐藤 健一',
        age: 68,
        gender: 'male',
        diagnosis: '誤嚥性肺炎・心不全',
        liverFunction: 'AST 28, ALT 22',
        renalFunction: 'eGFR 42, Cr 1.3',
        startDate: pastDate(5),
        attendingDoctor: '山田 太郎',
        doctorInCharge: '自分',
        examPlanned: true,
        medicalRecordChecked: false,
        rescueCount: 1,
        lastBowelDate: pastDate(2),
        medications: 'スルバシリン 3g×3回\nフロセミド 20mg 1T 1×朝\nマグミット 330mg 3T 3×毎食後',
        notes: '酸素3L投与中。明日採血・胸部Xpフォロー予定。離床進める。',
        nextPrescriptionDate: today, // 本日処方日アラート対象
        status: 'inpatient'
      },
      {
        room: '101',
        name: '田中 淑子',
        age: 74,
        gender: 'female',
        diagnosis: '大腸癌術後・脱水',
        liverFunction: 'AST 18, ALT 15',
        renalFunction: 'eGFR 58, Cr 0.8',
        startDate: pastDate(3),
        attendingDoctor: '鈴木 一郎',
        doctorInCharge: '自分',
        examPlanned: true,
        medicalRecordChecked: true,
        rescueCount: 0,
        lastBowelDate: today,
        medications: 'ビーフリード 1000ml/日\nカロナール 500mg 頓用',
        notes: '食事5割摂取。点滴明日オフ検討。排便良好。',
        nextPrescriptionDate: futureDate(7),
        status: 'inpatient'
      },
      {
        room: '102B',
        name: '伊藤 正夫',
        age: 82,
        gender: 'male',
        diagnosis: '脳梗塞後遺症・尿路感染症',
        liverFunction: 'AST 32, ALT 30',
        renalFunction: 'eGFR 31, Cr 1.7',
        startDate: pastDate(8),
        attendingDoctor: '高橋 次郎',
        doctorInCharge: '自分',
        examPlanned: false,
        medicalRecordChecked: false,
        rescueCount: 3,
        lastBowelDate: pastDate(4), // 排便4日前（要確認）
        medications: 'セフトリアキソン 1g 1×点滴\n酸化マグネシウム 500mg\nアムロジピン 5mg',
        notes: '発熱38.2度あり。排便4日なし、下剤追加または浣腸検討。',
        nextPrescriptionDate: pastDate(1), // 期限切れ処方アラート
        status: 'inpatient'
      },
      {
        room: '201',
        name: '渡辺 恵子',
        age: 59,
        gender: 'female',
        diagnosis: '急性胆嚢炎保存後',
        liverFunction: 'AST 45, ALT 52',
        renalFunction: 'eGFR 68, Cr 0.7',
        startDate: pastDate(2),
        attendingDoctor: '山田 太郎',
        doctorInCharge: '鈴木 一郎',
        examPlanned: false,
        medicalRecordChecked: false,
        rescueCount: 0,
        lastBowelDate: pastDate(1),
        medications: 'ウルソデオキシコール酸 100mg 3T\nレボフロキサシン 500mg 1T',
        notes: '腹痛軽快。来週エコー再検予定。',
        nextPrescriptionDate: futureDate(3),
        status: 'inpatient'
      },
      {
        room: '',
        name: '小林 義男',
        age: 65,
        gender: 'male',
        diagnosis: '2型糖尿病・高血圧症',
        liverFunction: '特記事項なし',
        renalFunction: 'eGFR 65, Cr 0.9',
        startDate: pastDate(30),
        attendingDoctor: '自分',
        doctorInCharge: '自分',
        examPlanned: true,
        nextVisitDate: futureDate(4),
        medications: 'ジャディアンス 10mg 1T\nメトグルコ 500mg 2T\nテルミサルタン 40mg 1T',
        notes: '食事指導実施。体重前回比-1.2kg。次回採血フォロー。',
        status: 'outpatient'
      },
      {
        room: '',
        name: '中村 真由美',
        age: 48,
        gender: 'female',
        diagnosis: '気管支喘息',
        liverFunction: '正常',
        renalFunction: '正常',
        startDate: pastDate(60),
        attendingDoctor: '高橋 次郎',
        doctorInCharge: '高橋 次郎',
        examPlanned: false,
        nextVisitDate: futureDate(14),
        medications: 'レルベア200 1吸入\nモンテルカスト 10mg 1T\nメプチンエアー（頓用）',
        notes: '夜間咳嗽なし。ピークフロー良好。',
        status: 'outpatient'
      },
      {
        room: '105',
        name: '松本 健二',
        age: 71,
        gender: 'male',
        diagnosis: '心不全増悪（軽快退院）',
        liverFunction: '正常',
        renalFunction: 'eGFR 48, BNP 180',
        startDate: pastDate(20),
        statusChangeDate: pastDate(2),
        attendingDoctor: '山田 太郎',
        doctorInCharge: '自分',
        examPlanned: false,
        medications: 'エンレスト 100mg 2T\nスピロノラクトン 25mg 1T',
        notes: '体重+0.5kg維持。家庭血圧良好。外来へ移行。',
        status: 'discharged'
      }
    ];

    for (const sample of samples) {
      await this.addPatient(sample);
    }

    await this.setSetting('lastAppOpenDate', today);
  }
}

// グローバルインスタンス
const patientDB = new PatientDB();
