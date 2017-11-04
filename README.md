# MMM-CalendarExtTimeline
Display current timeline schedules. This is a plugin module for `MMM-CalendarExt`

## Screenshot ##
![screenshot](https://raw.githubusercontent.com/eouia/MMM-CalendarExtTimeline/master/timeline_static.jpg)

## Installation ##
**`MMM-CalendarExt` should be installed together for using this module.**

**You should update your `MMM-CalendarExt`(new version after November 4,2017) before using this.**

```shell
cd <your MagicMirror Directory>/modules
git clone https://github.com/eouia/MMM-CalendarExtTimeline
```

## Configuration ##
```javascript
{
  module:"MMM-CalendarExtTimeline",
  position:"bottom_bar",
  config: {
    type: "static", // "static", "dynamic"
    refresh_interval_sec: 60, // minimum 60,
    table_title_format: "ddd, MMM Do",
    begin_hour: 0, //ignored when you set type to 'dynamic'
    end_hour: 6, //how many hours to show. 
    time_display_section_count: 6, 
    time_display_section_format: "HH:mm",
    calendars: ["your calendar name", "another name"] //in your `MMM-CalendarExt` configuration
  }
}
```
### type:"static" or "dynamic"
#### type:"static"
This will show timeline from `begin_hour` to `end_hour` of today. 

By example)
```javascript
type:"static",
begin_hour: 6,
end_hour: 18,
```
will show timeline of schedule which goes from 6:00 to 18:00 today.

#### type:"dynamic"
This will show timeline from `this hour` during `end_hour` now.
```javascript
type:"dynamic",
end_hour: 6,
```
If current time be 13:45, This would show schedules which goes from 13:00 to 19:00. The view will be changed automatically by time.
`begin_hour` will be ignored when type is set to `dynamic`.

### I just want to display only this module, not `MMM-CalendarExt` ###
In your configuration of `MMM-CalendarExt`, modify this.
```javascript
config: {
        system: {
          show: [], // set this field blank.
```
