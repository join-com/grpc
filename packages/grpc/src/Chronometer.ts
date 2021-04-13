export interface IChronometer {
  getEllapsedTime: () => number
}

export class Chronometer implements IChronometer {
  readonly startDate: Date

  constructor(startDate?: Date) {
    this.startDate = startDate ?? new Date()
  }

  public getEllapsedTime(): number {
    const now = new Date()
    return now.getTime() - this.startDate.getTime()
  }
}
