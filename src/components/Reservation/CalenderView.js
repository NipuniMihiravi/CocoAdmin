import Modal from 'react-modal';
import React, { useState, useEffect } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import './Calendar.css';

Modal.setAppElement('#root'); // Set the app root element for accessibility

const CalendarView = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNo: "",
    timeSlot: "",
    reservationDate: "",
    event: "",
    specificNote: ""
  });

  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [reservationDate, setReservationDate] = useState(new Date());
  const [errorMessage, setErrorMessage] = useState("");
  const [dateColors, setDateColors] = useState({});
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const API_URL = 'https://cocobackendrender.onrender.com/reservation';

  // Fetch reservations and map them to colors
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await axios.get(API_URL);
        console.log('Fetched reservations:', response.data); // Log fetched data
        setReservations(response.data);
        mapReservationToColors(response.data);
        filterReservationsByDate(response.data, reservationDate); // Filter for the initial date
      } catch (error) {
        console.error('Error fetching reservations:', error);
      }
    };

    fetchReservations();

    // Set up pinging every 5 minutes to keep the backend alive
    const intervalId = setInterval(() => {
      axios.get(API_URL)
        .then(() => console.log('Ping successful'))
        .catch(error => console.error('Ping failed:', error));
    }, 300000); // Ping every 5 minutes

    return () => clearInterval(intervalId); // Clear interval on component unmount
  }, []); // Run once on component mount

  // Update time slots and reservations when the date changes
  useEffect(() => {
    if (reservationDate) {
      checkAvailability(reservationDate);
      filterReservationsByDate(reservations, reservationDate); // Filter reservations for the selected date
    }
  }, [reservationDate, reservations]); // Run when reservationDate or reservations change

  // Check availability for the selected date
  const checkAvailability = async (date) => {
    try {
      const formattedDate = date.toLocaleDateString('en-CA');
      const response = await axios.get(`${API_URL}/checkAvailability?reservationDate=${formattedDate}`);
      const reservations = response.data;

      // Check for full-day booking or partial slots
      const fullDayBooked = reservations.some(reservation => reservation.timeSlot === "Full Time");
      if (fullDayBooked) {
        setAvailableTimeSlots([]);
        setErrorMessage("The full day is booked for this date. Please choose another day.");
        return;
      }

      const bookedTimeSlots = reservations.map(reservation => reservation.timeSlot);
      const isDayBooked = bookedTimeSlots.includes("Day Time");
      const isNightBooked = bookedTimeSlots.includes("Night Time");

      if (isDayBooked && isNightBooked) {
        setAvailableTimeSlots([]);
        setErrorMessage("Both the day and night slots are booked for this date. Please choose another day.");
        return;
      }

      if (isDayBooked || isNightBooked) {
        setAvailableTimeSlots(isDayBooked ? ["Night Time"] : ["Day Time"]);
        setErrorMessage("This date has an existing reservation for either the day or night. Please choose the remaining available slot.");
        return;
      }

      setAvailableTimeSlots(["Day Time", "Night Time", "Full Time"]);
      setErrorMessage("");
    } catch (error) {
      console.error("Error checking availability", error);
    }
  };

  // Map reservation data to colors based on timeSlot
  const mapReservationToColors = (reservations) => {
    const colors = {};

    reservations.forEach((reservation) => {
      const date = new Date(reservation.reservationDate);
      const formattedDate = date.toLocaleDateString('en-CA');

      if (reservation.status === 'Advance' || reservation.status === 'Confirm') {
        if (reservation.timeSlot === 'Full Time') {
          colors[formattedDate] = 'red'; // Fully booked
        } else if (reservation.timeSlot === 'Day Time') {
          colors[formattedDate] = colors[formattedDate] === 'pink' ? 'red' : 'yellow';
        } else if (reservation.timeSlot === 'Night Time') {
          colors[formattedDate] = colors[formattedDate] === 'yellow' ? 'red' : 'pink';
        }
      }
    });

    setDateColors(colors);
  };

  // Filter reservations based on selected date
  const filterReservationsByDate = (reservations, date) => {
    const formattedDate = date.toLocaleDateString('en-CA');
    const filtered = reservations.filter(reservation =>
      new Date(reservation.reservationDate).toLocaleDateString('en-CA') === formattedDate
    );
    setFilteredReservations(filtered);
  };

  // Render calendar tiles with colors
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const formattedDate = date.toLocaleDateString('en-CA');
      return dateColors[formattedDate] ? `reservation-${dateColors[formattedDate]}` : '';
    }
    return '';
  };

  const handleDateChange = (date) => {
    setReservationDate(date);
  };

  return (
    <div className="full-calendar-container">
      <h2>Event Calendar</h2>
      <div className="booking-status-container">
        <div className="status-box full-booked"><span>Full Booked</span></div>
        <div className="status-box day-booked"><span>Day Booked</span></div>
        <div className="status-box night-booked"><span>Night Booked</span></div>
      </div>

      <div className="calendar-container">
        <Calendar value={reservationDate} onChange={handleDateChange} tileClassName={tileClassName} />
      </div>

      <h2>Select Date - View Reservation</h2>
      <div className="reservation-list-container">
        <h3>Reservations for {reservationDate.toLocaleDateString("en-CA")}:</h3>
        {errorMessage ? (
          <p className="error-message">{errorMessage}</p>
        ) : filteredReservations.length === 0 ? (
          <p>No reservations found for this date.</p>
        ) : (
          <div>
            <p className="total-reservations">Total Reservations: {filteredReservations.length}</p>
            {filteredReservations.map((reservation) => (
              <div key={reservation.id} className="reservation-card">
                <h4 className="full-name">{reservation.fullName}</h4>
                <p className="contact">Email: {reservation.email}</p>
                <p className="contact">Contact No: {reservation.contactNo}</p>
                <p className="event">Event: {reservation.event}</p>
                <p className="time-slot">Time Slot: {reservation.timeSlot}</p>
                <p className="number-of-guests">Number of Guests: {reservation.numberOfPack}</p>
                <p className="buffet">Buffet: {reservation.buffet}</p>
                <p className="buffetPrice">Buffet Price: Rs. {reservation.buffetPrice}</p>
                <p className="total-price">Total Price: Rs. {reservation.totalPrice}</p>
                <p className="advance-payment">Advance Payment: Rs. {reservation.advancePayment}</p>
                <p className="due-payment">Due Payment: Rs. {reservation.duePayment}</p>
                <p className="status">Status: {reservation.status}</p>
                <p className="notes">Notes: {reservation.specialNote1}, {reservation.specialNote2}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
