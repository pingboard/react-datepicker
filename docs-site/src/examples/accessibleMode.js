() => {
  const [startDate, setStartDate] = useState(new Date());
  return (
    <DatePicker
      selected={startDate}
      onChange={date => setStartDate(date)}
      accessibleMode
      accessibleModeButton={<span>🗓</span>}
    />
  );
};
