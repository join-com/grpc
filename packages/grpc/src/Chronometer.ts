export interface IChronometer {
  getElapsedTime: () => number
}

export class Chronometer implements IChronometer {
  readonly startDate: Date

  constructor(startDate?: Date) {
    this.startDate = startDate ?? new Date()
  }

  public getElapsedTime(): number {
    const now = new Date()
    return now.getTime() - this.startDate.getTime()
  }
}
