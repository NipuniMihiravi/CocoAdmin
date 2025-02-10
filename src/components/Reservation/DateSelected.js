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
  const [bookedDates, setBookedDates] = useState(new Set()); // To track booked dates
  const API_URL = 'https://cocobackendrender.onrender.com/reservation';

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

      // Log response to check its structure
      console.log("Reservations Response:", response.data);

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

  // Fetch all reservations to identify booked dates
  useEffect(() => {
    const fetchAllReservations = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/reservation`); // Adjust your endpoint as needed
        const allReservations = response.data;

        // Log the data to check the structure
        console.log("All Reservations:", allReservations);

        // Extract dates for which reservations exist
        const dates = new Set(allReservations.map(reservation => {
          return new Date(reservation.reservationDate).toLocaleDateString("en-CA");
        }));
        setBookedDates(dates);
      } catch (error) {
        console.error("Error fetching all reservations:", error);
      }
    };

    fetchAllReservations();
  }, [API_URL]);

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
            return bookedDates.has(formattedDate) ? 'booked' : ''; // Highlight booked dates
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
