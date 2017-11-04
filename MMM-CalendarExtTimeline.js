/* Magic Mirror
* Module: MMM-CalendarExtTimeline
*
* By eouia
*/

var CALEXTTL = {}

CALEXTTL.round = function(number, precision) {
	var factor = Math.pow(10, precision)
	var tempNumber = number * factor
	var roundedTempNumber = Math.round(tempNumber)
	return roundedTempNumber / factor
}

Module.register("MMM-CalendarExtTimeline",{
	defaults: {
		type: "static", // "static", "dynamic"
		refresh_interval_sec: 60,
		table_title_format: "ddd, MMM Do",
		begin_hour: 8,
		end_hour: 20,
		time_display_section_count: 6,
		time_display_section_format: "hh:mm a",
		calendars: [],
	},

	start: function() {
		this.events = []
		if (this.config.refresh_interval_sec < 60) {
			this.config.refresh_interval_sec = 60
		}
		this.names = this.config.calendars
	},

	getStyles: function() {
		return ["MMM-CalendarExtTimeline.css"]
	},

	getScripts: function () {
		return ["moment.js"];
	},

	getDom: function() {
		if (this.config.type == "dynamic") {
			this.startTime = moment().startOf("hour")
			this.endTime = moment().startOf("hour")
				.add(this.config.end_hour, "hours").startOf("hour")
		} else {
			this.startTime = moment().hour(this.config.begin_hour).startOf("hour")
			this.endTime = moment().hour(this.config.end_hour).startOf("hour")
		}
		this.hour_diff_sec = Math.round(
			this.endTime.diff(this.startTime, "seconds")
			/ this.config.time_display_section_count
		)

		var wrapper = document.createElement("div")
		wrapper.className = "CALEXT CEXTML timeline"
		wrapper.id = "CALEXT_TIMELINE"
		var frameTable = document.createElement("table")
		frameTable.className = "frameTable"

		var frameHeader = document.createElement("thead")
		var frameHeaderRow = document.createElement("tr")
		var headerTitleCell = document.createElement("th")
		headerTitleCell.innerHTML = moment().format(this.config.table_title_format)
		headerTitleCell.className = "titleCol"
		var headerTimeCell = document.createElement("th")
		headerTimeCell.className = "timeCol"
		//var holder = document.createElement("div")
		//holder.className = "holder"
		//headerTimeCell.appendChild(holder)

		var hourTable = document.createElement("table")
		var httr = document.createElement("tr")

		var i = 0
		var st = this.startTime
		for(i=0; i<this.config.time_display_section_count; i++) {
			var td = document.createElement("td")
			var p = document.createElement("p")
			p.innerHTML
				= moment(st).format(this.config.time_display_section_format)
			st = moment(st).add(this.hour_diff_sec, "seconds")
			td.appendChild(p)
			httr.appendChild(td)
		}
		hourTable.appendChild(httr)
		headerTimeCell.appendChild(hourTable)

		var curTime = moment()

		if (curTime.isBetween(this.startTime, this.endTime)) {
			curTimeline = document.createElement("div")
			curTimeline.className = "current_timeline"
			var gap = this.endTime.diff(this.startTime, "seconds")
			var curgap = curTime.diff(this.startTime, "seconds")
			var position = CALEXTTL.round(curgap * 100/gap, 2)
			curTimeline.style.left = position + "%"
			headerTimeCell.appendChild(curTimeline)
		}

		frameHeaderRow.appendChild(headerTitleCell)
		frameHeaderRow.appendChild(headerTimeCell)
		frameHeader.appendChild(frameHeaderRow)
		frameTable.appendChild(frameHeader)

		var frameBody = document.createElement("tbody")
		var i = 0
		var self = this
		this.names.forEach(function(name){
			var row = document.createElement("tr")
			var nameCell = document.createElement("td")
			nameCell.className = "calendar calendar_" + i
			nameCell.innerHTML = name
			var scheduleCell = document.createElement("td")
			scheduleCell.className = "schedules schedules_" + i
			var holder = document.createElement("div")
			holder.className = "holder"

			holder = self.makeEvents(name, holder)
			scheduleCell.appendChild(holder)

			i++
			row.appendChild(nameCell)
			row.appendChild(scheduleCell)
			frameBody.appendChild(row)
		})
		frameTable.appendChild(frameBody)
		wrapper.appendChild(frameTable)
		return wrapper
	},

	notificationReceived: function(notification, payload, sender) {
		if (notification == "DOM_OBJECTS_CREATED") {
			this.updateDom()
			var self = this
			setInterval(function(){
				self.updateDom()
			}, this.config.refresh_interval_sec * 1000)
		}
		if (notification == "CALEXT_SAYS_CALENDAR_MODIFIED") {
			var self = this
			setTimeout(function(){
				self.updateRequest()
			}, 1000)
		}
		if (notification == "CALEXT_SAYS_SCHEDULE") {
			this.updateContent(payload)
		}
	},

	makeEvents: function(name, parentDom) {
		var startTime = moment(this.startTime)
		var endTime = moment(this.endTime)
		var totalGap = endTime.format("x") - startTime.format("x")
		var events = []
		var stack = [[]]
		this.events.forEach(function(e) {
			if (e.name) {
				if (e.name == name) {
					var eStart = moment.unix(e.startDate / 1000)
					var eEnd = moment.unix(e.endDate / 1000)
					var isValid = false
					if (eStart.isBetween(startTime, endTime, "minute", "[)")) {
						e.startInView = true
						isValid = true
					}
					if (eEnd.isBetween(startTime, endTime, "minute", "(]")) {
						e.endInView = true
						isValid = true
					}
					if (eStart.isSameOrBefore(startTime) && eEnd.isSameOrAfter(endTime)) {
						e.overView = true
						isValid = true
					}
					if (isValid) {
						var isPushed = false
						for(var j=0; j<stack.length; j++) {
							var s = stack[j]
							var fitToStack = true
							for(var i=0; i<s.length; i++) {
								var ee = s[i]
								var eeStart = moment.unix(ee.startDate / 1000)
								var eeEnd = moment.unix(ee.endDate / 1000)
								var isCrossed = eStart.isBetween(eeStart, eeEnd, "minute", "[)")
									|| eEnd.isBetween(eeStart, eeEnd, "minute", "(]")
								if (isCrossed) {
									fitToStack = false
									break
								}
							}
							if (fitToStack) {
								s.push(e)
								isPushed = true
								break
							}
						}
						if (!isPushed) {
							var s = []
							s.push(e)
							stack.push(s)
						}
					}
				}
			}
		})
		console.log("stack", stack)
		stack.forEach(function(s) {
			var line = document.createElement("div")
			line.className = "eventPositionLine"
			s.forEach(function(e) {
				var eStart = moment.unix(e.startDate / 1000)
				var eEnd = moment.unix(e.endDate / 1000)
				if (eStart.isBefore(startTime)) {
					eStart = moment(startTime)
				}
				if (eEnd.isAfter(endTime)) {
					eEnd = moment(endTime)
				}
				var gap = eEnd.format("x") - eStart.format("x")
				var width = CALEXTTL.round(gap * 100 / totalGap, 2) + "%"

				var startPosition = eStart.format("x") - startTime.format("x")
				var position = CALEXTTL.round(startPosition * 100 / totalGap, 2) + "%"

				var ev = document.createElement("div")
				ev.className = "event "
				ev.className += e.styleName
				ev.style.width = width
				ev.style.left = position
				ev.innerHTML = e.title
				if (e.startInView) {
					ev.className += " startHere"
				}
				if (e.endInView) {
					ev.className += " endHere"
				}
				if (e.fullDayEvent) {
					ev.className += " fulldayevent"
				}

				line.appendChild(ev)
			})

			parentDom.appendChild(line)
		})

		return parentDom
	},

	updateContent: function(payload=null) {
		if (payload != null) {
			if(payload.message == "SCHEDULE_FOUND") {
				this.events = payload.events
				this.events.sort(function(a, b){
					if (a.startTime == b.startTime) {
						return a.endTime - b.endTime
					} else {
						return a.startTime - b.startTime
					}
				})
			}
			this.updateDom()
		}
	},
	updateRequest: function() {
		var filter = {
		  names: this.names,
			from: moment().startOf('day').format('x'),
		  to: moment().endOf('day').format('x'),
		  count: 100
		}
		var payload = {
		  filter: filter,
		  sessionId: moment().format('x')
		}
		this.sendNotification("CALEXT_TELL_SCHEDULE", payload)
	}
})
