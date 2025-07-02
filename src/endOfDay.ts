export const END_OF_DAY_HOUR = 22

export function testHour(value: number): void{
  if (value < 0) {
    throw new RangeError('param representing end of day must be 0 or higher')
  }

  if (value > 23) {
    throw new RangeError('param representing end of day must be 23 or less')
  }

  if (!(Number.isInteger(value))) {
    throw new RangeError('param representing end of day must be an integer')
  }
}

export function getLastEndOfDay (): Date {
  const endOfDay = getTodaysEndOfDay()

  if ((new Date()).valueOf() - endOfDay.valueOf() < 0) {
    endOfDay.setDate(endOfDay.getDate() - 1)
  }
  
  return endOfDay
}

export function getNextEndOfDay (): Date {
  const endOfDay = getTodaysEndOfDay()

  if ((new Date()).valueOf() - endOfDay.valueOf() >= 0) {
    endOfDay.setDate(endOfDay.getDate() + 1)
  }

  return endOfDay
}

function getTodaysEndOfDay (): Date {
  const endOfDayToday = new Date()

  endOfDayToday.setMilliseconds(0)
  endOfDayToday.setMinutes(0)
  endOfDayToday.setSeconds(0)
  endOfDayToday.setHours(END_OF_DAY_HOUR)

  return endOfDayToday
}