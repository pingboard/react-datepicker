import React from "react";
import PropTypes from "prop-types";
import FocusTrap from "focus-trap-react";
import classNames from "classnames";
import { ScreenReaderOnly } from "./screen_reader_only";
import {
  addMonths,
  formatDate,
  getStartOfMonth,
  newDate,
  isAfter,
  isSameMonth,
  isSameYear,
  isBefore,
  getTime
} from "./date_utils";

function generateMonthYears(minDate, maxDate) {
  const list = [];

  let currDate = getStartOfMonth(minDate);
  const lastDate = getStartOfMonth(maxDate);

  while (!isAfter(currDate, lastDate)) {
    list.push(newDate(currDate));

    currDate = addMonths(currDate, 1);
  }
  return list;
}

export default class MonthYearDropdownOptions extends React.Component {
  static propTypes = {
    minDate: PropTypes.instanceOf(Date).isRequired,
    maxDate: PropTypes.instanceOf(Date).isRequired,
    onCancel: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    scrollableMonthYearDropdown: PropTypes.bool,
    date: PropTypes.instanceOf(Date).isRequired,
    dateFormat: PropTypes.string.isRequired,
    accessibleMode: PropTypes.bool
  };

  constructor(props) {
    super(props);

    this.state = {
      monthYearsList: generateMonthYears(
        this.props.minDate,
        this.props.maxDate
      ),
      preSelection: getStartOfMonth(this.props.date),
      readInstructions: false
    };
  }

  componentDidMount() {
    if (this.preSelectionDiv) {
      this.preSelectionDiv.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        inline: "nearest"
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.preSelectionDiv) {
      this.preSelectionDiv.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        inline: "nearest"
      });
    }
  }

  renderOptions = () => {
    return this.state.monthYearsList.map(monthYear => {
      const monthYearPoint = getTime(monthYear);
      const isSameMonthYear =
        isSameYear(this.props.date, monthYear) &&
        isSameMonth(this.props.date, monthYear);

      const isPreselectionSameMonthYear =
        isSameYear(this.state.preSelection, monthYear) &&
        isSameMonth(this.state.preSelection, monthYear);

      return (
        <div
          className={classNames(
            "react-datepicker__month-year-option",
            {
              "react-datepicker__month-year-option--selected_month-year": isSameMonthYear
            },
            {
              "react-datepicker__month-year-option--preselected":
                this.props.accessibleMode && isPreselectionSameMonthYear
            }
          )}
          key={monthYearPoint}
          ref={div => {
            if (this.props.accessibleMode && isPreselectionSameMonthYear) {
              this.preSelectionDiv = div;
            }
          }}
          onClick={this.onChange.bind(this, monthYearPoint)}
        >
          {isSameMonthYear ? (
            <span className="react-datepicker__month-year-option--selected">
              ✓
            </span>
          ) : (
            ""
          )}
          {formatDate(monthYear, this.props.dateFormat)}
        </div>
      );
    });
  };

  onFocus = () => {
    if (this.props.accessibleMode) {
      this.setState({ readInstructions: true });
    }
  };

  onChange = monthYear => this.props.onChange(monthYear);

  handleClickOutside = () => {
    this.props.onCancel();
  };

  onInputKeyDown = event => {
    const eventKey = event.key;
    let newSelection;
    switch (eventKey) {
      case "ArrowUp":
        event.preventDefault();
        event.stopPropagation();
        newSelection = addMonths(this.state.preSelection, -1);
        break;
      case "ArrowDown":
        event.preventDefault();
        event.stopPropagation();
        newSelection = addMonths(this.state.preSelection, 1);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        this.props.onCancel();
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        event.stopPropagation();
        this.props.onChange(this.state.preSelection.valueOf());
        break;
    }
    if (newSelection) {
      const minMonthYear = this.state.monthYearsList[0];
      const maxMonthYear = this.state.monthYearsList[
        this.state.monthYearsList.length - 1
      ];
      if (isBefore(newSelection, minMonthYear)) newSelection = maxMonthYear;
      if (isAfter(newSelection, maxMonthYear)) newSelection = minMonthYear;
      this.setState({ preSelection: newSelection });
    }
  };

  render() {
    let dropdownClass = classNames({
      "react-datepicker__month-year-dropdown": true,
      "react-datepicker__month-year-dropdown--scrollable": this.props
        .scrollableMonthYearDropdown
    });

    let screenReaderInstructions;
    if (this.state.readInstructions) {
      screenReaderInstructions = (
        <p aria-live>
          You are focused on a month / year selector menu. Use the up and down
          arrows to select a month / year combination, then hit enter to confirm
          your selection.
          {formatDate(this.state.preSelection, this.props.dateFormat)} is the
          currently focused month / year.
        </p>
      );
    }

    return this.props.accessibleMode ? (
      <FocusTrap>
        <div
          className={dropdownClass}
          tabIndex="0"
          onKeyDown={this.onInputKeyDown}
          onFocus={this.onFocus}
        >
          <ScreenReaderOnly>
            <span>{screenReaderInstructions}</span>
          </ScreenReaderOnly>
          {this.renderOptions()}
        </div>
      </FocusTrap>
    ) : (
      <div className={dropdownClass}>{this.renderOptions()}</div>
    );

    return <div className={dropdownClass}>{this.renderOptions()}</div>;
  }
}
