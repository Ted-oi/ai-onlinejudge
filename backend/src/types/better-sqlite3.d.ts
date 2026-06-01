declare module 'better-sqlite3' {
  interface Statement {
    run(...params: any[]): any
    get(...params: any[]): any
    all(...params: any[]): any[]
  }
  interface Database {
    exec(sql: string): Database
    prepare(sql: string): Statement
    close(): void
  }
  class BetterSqlite3 {
    constructor(filename: string, options?: { verbose?: Function })
    exec(sql: string): Database
    prepare(sql: string): Statement
    close(): void
  }
  export = BetterSqlite3
}
