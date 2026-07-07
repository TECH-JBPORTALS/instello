export function getAttendanceTimeContext() {
	return {
		now: Date.now(),
		timezoneOffsetMinutes: new Date().getTimezoneOffset(),
	};
}
