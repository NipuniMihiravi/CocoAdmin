import Modal from 'react-modal';
import React, { useState, useEffect } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Ensure the calendar CSS is imported
import './Calendar.css'; // Import CSS file for styling

Modal.setAppElement('#root'); // Set the app root element for accessibility

const DateSelected = () => {
  const [reservationDate, setReservationDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const API_URL = process.env.REACT_APP_API_URL; // Fetch the API URL from environment variable

  // Function to handle date selection
  const handleDateChange = (date) => {
    setReservationDate(date);
  };

  // Function to fetch reservations for the selected date
  const fetchReservationsForDate = async (date) => {
    try {
      const formattedDate = date.toLocaleDateString("en-CA"); // Format date as 'YYYY-MM-DD'
      const response = await axios.get(
        `${API_URL}/api/reservation/checkAvailability?reservationDate=${formattedDate}`
      );
      setReservations(response.data);
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetching reservations", error);
      setErrorMessage("Could not fetch reservations for the selected date.");
    }
  };

  // Trigger fetching reservations when date is selected
  useEffect(() => {
    if (reservationDate) {
      fetchReservationsForDate(reservationDate);
    }
  }, [reservationDate]);

  return (
    <div className="full-calendar-container">
      <h2>Select Date - View Reservation</h2>

      {/* Calendar to pick a date */}
      <div className="calendar-container">
        <Calendar
          value={reservationDate}
          onChange={handleDateChange}
          tileClassName={({ date }) => {
            const formattedDate = date.toLocaleDateString("en-CA");
            // Apply CSS class to highlight booked dates if needed
            return "";
          }}
        />
      </div>

      <div className="reservation-list-container">
        <h3>Reservations for {reservationDate.toLocaleDateString("en-CA")}:</h3>

        {errorMessage ? (
          <p className="error-message">{errorMessage}</p>
        ) : reservations.length === 0 ? (
          <p>No reservations found for this date.</p>
        ) : (
          reservations.map((reservation) => (
            <div key={reservation.id} className="reservation-card">
              <h4>{reservation.fullName}</h4>
              <p>Email: {reservation.email}</p>
              <p>Contact No: {reservation.contactNo}</p>
              <p>Event: {reservation.event}</p>
              <p>Time Slot: {reservation.timeSlot}</p>
              <p>Number of Guests: {reservation.numberOfPack}</p>
              <p>Buffet: {reservation.buffet} (${reservation.buffetPrice})</p>
              <p>Total Price: ${reservation.totalPrice}</p>
              <p>Advance Payment: ${reservation.advancePayment}</p>
              <p>Due Payment: ${reservation.duePayment}</p>
              <p>Status: {reservation.status}</p>
              <p>Notes: {reservation.specialNote1}, {reservation.specialNote2}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DateSelected;
