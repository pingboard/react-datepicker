import React from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import { ScreenReaderOnly } from "./screen_reader_only";
import {
  getHours,
  getMinutes,
  newDate,
  getStartOfDay,
  addMinutes,
  formatDate,
  isTimeInDisabledRange,
  isTimeDisabled,
  timesToInjectAfter,
  setTime
} from "./date_utils";

function doHoursAndMinutesAlign(time1, time2) {
  if (time1 == null || time2 == null) return false;
  return (
    getHours(time1) === getHours(time2) &&
    getMinutes(time1) === getMinutes(time2)
  );
}

export default class Time extends React.Component {
  static get defaultProps() {
    return {
      intervals: 30,
      onTimeChange: () => {},
      todayButton: null,
      timeCaption: "Time"
    };
  }

  static calcCenterPosition = (listHeight, centerLiRef) => {
    return (
      centerLiRef.offsetTop - (listHeight / 2 - centerLiRef.clientHeight / 2)
    );
  };

  static propTypes = {
    format: PropTypes.string,
    includeTimes: PropTypes.array,
    intervals: PropTypes.number,
    selected: PropTypes.instanceOf(Date),
    onChange: PropTypes.func,
    todayButton: PropTypes.node,
    minTime: PropTypes.instanceOf(Date),
    maxTime: PropTypes.instanceOf(Date),
    excludeTimes: PropTypes.array,
    monthRef: PropTypes.object,
    timeCaption: PropTypes.string,
    injectTimes: PropTypes.array,
    locale: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ locale: PropTypes.object })
    ]),
    accessibleMode: PropTypes.bool
  };

  constructor(...args) {
    super(...args);

    const times = this.generateTimes();
    const preSelection = times.reduce((preSelection, time) => {
      if (preSelection) return preSelection;
      if (doHoursAndMinutesAlign(time, this.props.selected)) {
        return time;
      }
    }, null);

    this.timeFormat = "hh:mm A";
    this.state = {
      preSelection,
      readInstructions: false,
      height: null
    };
  }

  componentDidMount() {
    // code to ensure selected time will always be in focus within time window when it first appears
    this.list.scrollTop = Time.calcCenterPosition(
      this.props.monthRef
        ? this.props.monthRef.clientHeight - this.header.clientHeight
        : this.list.clientHeight,
      this.centerLi
    );

    if (this.state.preSelection == null) {
      // there is no pre-selection, find the element closest to the selected time and preselect it
      const currH = this.props.selected
        ? getHours(this.props.selected)
        : getHours(newDate());
      const currM = this.props.selected
        ? getMinutes(this.props.selected)
        : getMinutes(newDate());
      const closestTimeIndex = Math.floor(
        (60 * currH + currM) / this.props.intervals
      );
      const closestMinutes = closestTimeIndex * this.props.intervals;
      const closestTime = setTime(newDate(), {
        hour: Math.floor(closestMinutes / 60),
        minute: closestMinutes % 60,
        second: 0
      });
      this.setState({ preSelection: closestTime });
    }

    if (this.props.monthRef && this.header) {
      this.setState({
        height: this.props.monthRef.clientHeight - this.header.clientHeight
      });
    }
  }

  componentDidUpdate() {
    // scroll to the preSelected time
    const scrollToElement = this.preselectedLi;

    if (scrollToElement) {
      // an element matches the selected time, scroll to it
      scrollToElement.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        inline: "nearest"
      });
    }
  }

  onFocus = () => {
    if (this.props.accessibleMode) {
      this.setState({ readInstructions: true });
    }
  };

  onInputKeyDown = event => {
    const eventKey = event.key;
    const copy = newDate(this.state.preSelection);
    let newSelection;
    switch (eventKey) {
      case "ArrowUp":
        newSelection = addMinutes(copy, -this.props.intervals);
        break;
      case "ArrowDown":
        newSelection = addMinutes(copy, this.props.intervals);
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        this.handleClick(this.state.preSelection);
        break;
    }
    if (!newSelection) return; // Let the input component handle this keydown
    event.preventDefault();
    this.setState({ preSelection: newSelection });
  };

  handleClick = time => {
    if (
      ((this.props.minTime || this.props.maxTime) &&
        isTimeInDisabledRange(time, this.props)) ||
      (this.props.excludeTimes &&
        isTimeDisabled(time, this.props.excludeTimes)) ||
      (this.props.includeTimes &&
        !isTimeDisabled(time, this.props.includeTimes))
    ) {
      return;
    }
    this.props.onChange(time);
  };

  liClasses = (time, activeTime) => {
    let classes = ["react-datepicker__time-list-item"];

    if (doHoursAndMinutesAlign(time, activeTime)) {
      classes.push("react-datepicker__time-list-item--selected");
    } else if (
      this.state.preSelection &&
      doHoursAndMinutesAlign(time, this.state.preSelection)
    ) {
      classes.push("react-datepicker__time-list-item--preselected");
    }
    if (
      ((this.props.minTime || this.props.maxTime) &&
        isTimeInDisabledRange(time, this.props)) ||
      (this.props.excludeTimes &&
        isTimeDisabled(time, this.props.excludeTimes)) ||
      (this.props.includeTimes &&
        !isTimeDisabled(time, this.props.includeTimes))
    ) {
      classes.push("react-datepicker__time-list-item--disabled");
    }
    if (
      this.props.injectTimes &&
      (getHours(time) * 60 + getMinutes(time)) % this.props.intervals !== 0
    ) {
      classes.push("react-datepicker__time-list-item--injected");
    }

    return classes.join(" ");
  };

  generateTimes = () => {
    let times = [];
    const format = this.props.format ? this.props.format : "p";
    const intervals = this.props.intervals;
    const activeTime = this.props.selected ? this.props.selected : newDate();
    const currH = getHours(activeTime);
    const currM = getMinutes(activeTime);
    let base = getStartOfDay(newDate());
    const multiplier = 1440 / intervals;
    const sortedInjectTimes =
      this.props.injectTimes &&
      this.props.injectTimes.sort(function(a, b) {
        return a - b;
      });
    for (let i = 0; i < multiplier; i++) {
      const currentTime = addMinutes(base, i * intervals);
      times.push(currentTime);

      if (sortedInjectTimes) {
        const timesToInject = timesToInjectAfter(
          base,
          currentTime,
          i,
          intervals,
          sortedInjectTimes
        );
        times = times.concat(timesToInject);
      }
    }
    return times;
  };

  renderTimes = () => {
    const times = this.generateTimes();
    const activeTime = this.props.selected ? this.props.selected : newDate();
    const format = this.props.format ? this.props.format : this.timeFormat;
    const currH = getHours(activeTime);
    const currM = getMinutes(activeTime);
    return times.map((time, i) => (
      <li
        key={i}
        onClick={this.handleClick.bind(this, time)}
        className={this.liClasses(time, activeTime)}
        ref={li => {
          if (
            (currH === getHours(time) && currM === getMinutes(time)) ||
            (currH === getHours(time) && !this.centerLi)
          ) {
            this.centerLi = li;
          }

          if (
            li &&
            li.classList.contains(
              "react-datepicker__time-list-item--preselected"
            )
          ) {
            this.preselectedLi = li;
          }
        }}
        role="option"
        id={i}
      >
        {formatDate(time, format, this.props.locale)}
      </li>
    ));
  };

  render() {
    const { height } = this.state;

    const classNames = classnames("react-datepicker__time-container", {
      "react-datepicker__time-container--with-today-button": this.props
        .todayButton
    });

    const timeBoxClassNames = classnames("react-datepicker__time-box", {
      "react-datepicker__time-box--accessible": this.props.accessibleMode
    });

    let screenReaderInstructions;
    if (this.state.readInstructions) {
      screenReaderInstructions = (
        <p aria-live>
          You are a in a time selector. Use the up and down keys to select from
          other common times then press enter to confirm.
          {formatDate(this.state.preSelection, this.timeFormat)} is currently
          focused.
        </p>
      );
    }

    return (
      <div className={classNames}>
        <div
          className="react-datepicker__header react-datepicker__header--time"
          ref={header => {
            this.header = header;
          }}
        >
          <div className="react-datepicker-time__header">
            {this.props.timeCaption}
          </div>
          <ScreenReaderOnly>
            <span>{screenReaderInstructions}</span>
          </ScreenReaderOnly>
        </div>
        <div className="react-datepicker__time">
          <div
            className={timeBoxClassNames}
            tabIndex={this.props.accessibleMode ? 0 : -1}
            onKeyDown={this.onInputKeyDown}
            onFocus={this.onFocus}
          >
            <ul
              className="react-datepicker__time-list"
              ref={list => {
                this.list = list;
              }}
              style={height ? { height } : {}}
              role="listbox"
            >
              {this.renderTimes()}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}
