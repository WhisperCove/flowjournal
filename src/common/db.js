/**
 * FlowDB - SQLite 数据库封装类
 * App 端：plus.sqlite（静态方法 API）
 * H5 端：内存存储降级
 */

const DB_NAME = 'flowjournal.db'

class FlowDB {
  constructor() {
    this.isReady = false
    this._initPromise = null
    this._useMem = false

    // 内存存储（H5 降级或 App 降级）
    this._mem = { diaries: [], todos: [], diaryId: 0, todoId: 0 }
  }

  init() {
    if (this._initPromise) return this._initPromise
    this._initPromise = new Promise((resolve, reject) => {
      // #ifdef APP-PLUS
      this._initAppPlus(resolve, reject)
      // #endif
      // #ifndef APP-PLUS
      this._initMem(resolve)
      // #endif
    })
    return this._initPromise
  }

  // ==================== APP 端：plus.sqlite ====================

  // #ifdef APP-PLUS
  _initAppPlus(resolve, reject) {
    try {
      if (!plus || !plus.sqlite) throw new Error('plus.sqlite not available')

      // 先检查是否已打开
      if (plus.sqlite.isOpenDatabase({ name: DB_NAME })) {
        console.log('[FlowDB] 数据库已打开，跳过')
        this._createTables().then(() => {
          this.isReady = true; resolve()
        }).catch(reject)
        return
      }

      plus.sqlite.openDatabase({
        name: DB_NAME,
        path: '_doc/flowjournal.db',
        success: () => {
          this._createTables().then(() => {
            this.isReady = true; resolve()
          }).catch(reject)
        },
        fail: (err) => {
          const msg = typeof err === 'object' ? JSON.stringify(err) : String(err)
          // -1402 = Same Name Already Open 视为已打开成功
          if (msg.indexOf('-1402') !== -1 || msg.indexOf('Same Name') !== -1) {
            console.log('[FlowDB] 数据库已存在，继续使用')
            this._createTables().then(() => {
              this.isReady = true; resolve()
            }).catch(reject)
          } else {
            console.error('[FlowDB] 打开数据库失败:', msg)
            this._fallbackToMem(resolve)
          }
        }
      })
    } catch (e) {
      console.error('[FlowDB] plus.sqlite 异常:', e)
      this._fallbackToMem(resolve)
    }
  }

  _fallbackToMem(resolve) {
    console.warn('[FlowDB] 降级到内存存储')
    this._useMem = true
    this._initMem(resolve)
  }

  _createTables() {
    const sql = [
      `CREATE TABLE IF NOT EXISTS diaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        mood TEXT DEFAULT '🍃',
        date TEXT,
        fullDate TEXT,
        timestamp INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        categoryId TEXT DEFAULT 'default',
        sortIndex INTEGER DEFAULT 0,
        createdAt INTEGER
      )`
    ]
    return this._exec(sql).then(() => this._migrate())
  }

  // 迁移：兼容旧表（无 categoryId 时补充）
  _migrate() {
    // categoryId
    try {
      plus.sqlite.executeSql({ name: DB_NAME, sql: "ALTER TABLE todos ADD COLUMN categoryId TEXT DEFAULT 'default'", success: () => {}, fail: () => {} })
    } catch (e) { /* 已存在 */ }
    try {
      plus.sqlite.executeSql({ name: DB_NAME, sql: "ALTER TABLE todos ADD COLUMN sortIndex INTEGER DEFAULT 0", success: () => {}, fail: () => {} })
    } catch (e) { /* 已存在 */ }
  }

  _exec(sql) {
    return new Promise((resolve, reject) => {
      plus.sqlite.executeSql({
        name: DB_NAME,
        sql,
        success: () => resolve(),
        fail: (err) => reject(err)
      })
    })
  }

  _query(sql) {
    return new Promise((resolve, reject) => {
      plus.sqlite.selectSql({
        name: DB_NAME,
        sql,
        success: (res) => resolve(res || []),
        fail: (err) => reject(err)
      })
    })
  }
  // #endif

  // ==================== 内存存储（通用降级） ====================

  _initMem(resolve) {
    console.log('[FlowDB] 使用内存存储')
    this._useMem = true
    this.isReady = true
    resolve()
  }

  _memAdd(type, data) {
    const store = this._mem[type]
    if (!store) return null
    const id = type === 'diaries' ? ++this._mem.diaryId : ++this._mem.todoId
    store.push({ ...data, id })  // 新 id 覆盖旧数据中的 id
    return id
  }

  _memGetAll(type) {
    const store = this._mem[type] || []
    if (type === 'diaries') {
      return [...store].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    }
    return [...store].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }

  _memUpdate(type, id, updater) {
    const store = this._mem[type]
    if (!store) return
    const idx = store.findIndex(i => i.id === id)
    if (idx !== -1) updater(store[idx])
  }

  _memDelete(type, id) {
    const store = this._mem[type]
    if (!store) return
    this._mem[type] = store.filter(i => i.id !== id)
  }

  _memGetStats() {
    const d = this._mem.diaries.length
    const done = this._mem.todos.filter(t => t.completed).length
    const days = new Set(this._mem.diaries.map(d => d.date)).size
    return { diaryCount: d, todoDone: done, streak: Math.max(1, days) }
  }

  // ==================== 公共 API ====================

  async getDiaries() {
    if (this._useMem) return this._memGetAll('diaries')
    // #ifdef APP-PLUS
    return this._query('SELECT * FROM diaries ORDER BY timestamp DESC')
    // #endif
    // #ifndef APP-PLUS
    return this._memGetAll('diaries')
    // #endif
  }

  async addDiary(diary) {
    if (this._useMem) return this._memAdd('diaries', diary)
    // #ifdef APP-PLUS
    const sql = `INSERT INTO diaries (text, mood, date, fullDate, timestamp)
      VALUES ('${this._esc(diary.text)}', '${this._esc(diary.mood || '🍃')}',
              '${this._esc(diary.date)}', '${this._esc(diary.fullDate)}', ${diary.timestamp})`
    await this._exec(sql)
    const rows = await this._query('SELECT last_insert_rowid() as id')
    return rows?.[0]?.id ?? null
    // #endif
    // #ifndef APP-PLUS
    return this._memAdd('diaries', diary)
    // #endif
  }

  async deleteDiary(id) {
    if (this._useMem) return this._memDelete('diaries', id)
    // #ifdef APP-PLUS
    await this._exec(`DELETE FROM diaries WHERE id = ${Number(id)}`)
    // #endif
    // #ifndef APP-PLUS
    this._memDelete('diaries', id)
    // #endif
  }

  async updateDiary(id, text) {
    if (this._useMem) { this._memUpdate('diaries', id, d => { d.text = text }); return }
    // #ifdef APP-PLUS
    await this._exec(`UPDATE diaries SET text = '${this._esc(text)}' WHERE id = ${Number(id)}`)
    // #endif
    // #ifndef APP-PLUS
    this._memUpdate('diaries', id, d => { d.text = text })
    // #endif
  }

  async getTodos() {
    if (this._useMem) return this._memGetAll('todos')
    // #ifdef APP-PLUS
    const rows = await this._query('SELECT * FROM todos ORDER BY createdAt DESC')
    return (rows || []).map(t => ({ ...t, completed: t.completed === 1 }))
    // #endif
    // #ifndef APP-PLUS
    return this._memGetAll('todos')
    // #endif
  }

  async addTodo(text, categoryId) {
    const createdAt = Date.now()
    const catId = categoryId || 'default'
    if (this._useMem) {
      const id = this._memAdd('todos', { text, completed: false, categoryId: catId, createdAt })
      return { id, text, completed: false, categoryId: catId, createdAt }
    }
    // #ifdef APP-PLUS
    await this._exec(`INSERT INTO todos (text, completed, categoryId, createdAt) VALUES ('${this._esc(text)}', 0, '${this._esc(catId)}', ${createdAt})`)
    const rows = await this._query('SELECT last_insert_rowid() as id')
    const id = rows?.[0]?.id ?? null
    return { id, text, completed: false, categoryId: catId, createdAt }
    // #endif
    // #ifndef APP-PLUS
    const todo = this._memAdd('todos', { text, completed: false, categoryId: catId, createdAt })
    return { id: todo, text, completed: false, categoryId: catId, createdAt }
    // #endif
  }

  async toggleTodo(id, completed) {
    if (this._useMem) return this._memUpdate('todos', id, t => { t.completed = completed })
    // #ifdef APP-PLUS
    await this._exec(`UPDATE todos SET completed = ${completed ? 1 : 0} WHERE id = ${Number(id)}`)
    // #endif
    // #ifndef APP-PLUS
    this._memUpdate('todos', id, t => { t.completed = completed })
    // #endif
  }

  async updateTodoText(id, text) {
    if (this._useMem) { this._memUpdate('todos', id, t => { t.text = text }); return }
    // #ifdef APP-PLUS
    await this._exec(`UPDATE todos SET text = '${this._esc(text)}' WHERE id = ${Number(id)}`)
    // #endif
    // #ifndef APP-PLUS
    this._memUpdate('todos', id, t => { t.text = text })
    // #endif
  }

  async getTodosByCategory(categoryId) {
    const all = await this.getTodos()
    return all.filter(t => (t.categoryId || 'default') === categoryId)
  }

  async deleteTodo(id) {
    if (this._useMem) return this._memDelete('todos', id)
    // #ifdef APP-PLUS
    await this._exec(`DELETE FROM todos WHERE id = ${Number(id)}`)
    // #endif
    // #ifndef APP-PLUS
    this._memDelete('todos', id)
    // #endif
  }

  async getStats() {
    if (this._useMem) return this._memGetStats()
    // #ifdef APP-PLUS
    try {
      const [diaryRes, todoRes, streakRes] = await Promise.all([
        this._query('SELECT COUNT(*) as count FROM diaries'),
        this._query('SELECT COUNT(*) as count FROM todos WHERE completed = 1'),
        this._query('SELECT COUNT(DISTINCT date) as count FROM diaries')
      ])
      return {
        diaryCount: diaryRes?.[0]?.count || 0,
        todoDone: todoRes?.[0]?.count || 0,
        streak: Math.max(1, streakRes?.[0]?.count || 0)
      }
    } catch (e) {
      return { diaryCount: 0, todoDone: 0, streak: 1 }
    }
    // #endif
    // #ifndef APP-PLUS
    return this._memGetStats()
    // #endif
  }

  // ========== 工具 ==========

  _esc(s) {
    if (typeof s !== 'string') return ''
    return s.replace(/'/g, "''")
  }
}

export default FlowDB
