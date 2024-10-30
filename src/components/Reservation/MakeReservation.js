import Modal from 'react-modal';
import React, { useState, useEffect } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Ensure the calendar CSS is imported
import './Calendar.css'; // Import CSS file for styling

Modal.setAppElement('#root'); // Set the app root element for accessibility

const MakeReservation = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNo: "",
    timeSlot: "",
    reservationDate: "",
    event: "",
    numberOfPack: "",
    specificNote: ""
  });

  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isFullDayBooked, setIsFullDayBooked] = useState(false);
  const [reservationDate, setReservationDate] = useState(new Date());
  const [dateColors, setDateColors] = useState({});
  const API_URL = 'https://cocoback-6.onrender.com/api/reservation';

  useEffect(() => {
    fetchReservations();

    const intervalId = setInterval(() => {
      axios.get(API_URL)
        .then(() => console.log('Ping successful'))
        .catch(error => console.error('Ping failed:', error));
    }, 300000); // Ping every 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "reservationDate") {
      setReservationDate(value);
    }
  };

  useEffect(() => {
    checkAvailability(reservationDate);
  }, [reservationDate]);

  const checkAvailability = async (date) => {
    try {
      const formattedDate = new Date(date).toISOString().split('T')[0];
      const response = await axios.get(`${API_URL}/checkAvailability?reservationDate=${formattedDate}`);
      const reservations = response.data;

      const fullDayBooked = reservations.some(reservation => reservation.timeSlot === "Full Time");
      setIsFullDayBooked(fullDayBooked);

      if (fullDayBooked) {
        setAvailableTimeSlots([]);
        return;
      }

      const bookedTimeSlots = reservations.map(reservation => reservation.timeSlot);
      const isDayBooked = bookedTimeSlots.includes("Day Time");
      const isNightBooked = bookedTimeSlots.includes("Night Time");

      if (isDayBooked && isNightBooked) {
        setAvailableTimeSlots([]);
      } else if (isDayBooked || isNightBooked) {
        setAvailableTimeSlots(isDayBooked ? ["Night Time"] : ["Day Time"]);
      } else {
        setAvailableTimeSlots(["Day Time", "Night Time", "Full Time"]);
      }
    } catch (error) {
      console.error("Error checking availability", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(API_URL, formData);
      if (response.status === 200) {
        alert("Reservation submitted successfully!");
        setFormData({
          fullName: "",
          email: "",
          contactNo: "",
          timeSlot: "",
          reservationDate: "",
          event: "",
          numberOfPack: "",
          specificNote: ""
        });
        fetchReservations();
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert("This time slot is already booked. Please choose a different time or date.");
      } else {
        console.error("Error submitting reservation", error);
      }
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await axios.get(API_URL);
      mapReservationToColors(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const mapReservationToColors = (reservations) => {
    const colors = {};

    reservations.forEach((reservation) => {
      const date = new Date(reservation.reservationDate).toLocaleDateString('en-CA');

      if (reservation.status === 'Advance' || reservation.status === 'Confirm') {
        if (reservation.timeSlot === 'Full Time') {
          colors[date] = 'red';
        } else if (reservation.timeSlot === 'Day Time') {
          colors[date] = colors[date] === 'pink' ? 'red' : 'yellow';
        } else if (reservation.timeSlot === 'Night Time') {
          colors[date] = colors[date] === 'yellow' ? 'red' : 'pink';
        }
      }
    });

    setDateColors(colors);
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const formattedDate = date.toLocaleDateString('en-CA');
      return dateColors[formattedDate] ? `reservation-${dateColors[formattedDate]}` : '';
    }
    return '';
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
        <Calendar tileClassName={tileClassName} />
      </div>
      <h2>Reservation Form</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Contact No:</label>
          <input
            type="text"
            name="contactNo"
            value={formData.contactNo}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Reservation Date:</label>
          <input
            type="date"
            name="reservationDate"
            value={formData.reservationDate}
            onChange={handleInputChange}
            required
          />
        </div>
        {isFullDayBooked ? (
          <p>The full day is booked for this date. Please choose another day.</p>
        ) : (
          <div>
            <label>Time Slot:</label>
            <select
              name="timeSlot"
              value={formData.timeSlot}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a Time Slot</option>
              {availableTimeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label>Event:</label>
          <select
            name="event"
            value={formData.event}
            onChange={handleInputChange}
          >
            <option value="">-- Select an Event --</option>
            <option value="Day Outing">Day Outing</option>
            <option value="Wedding Event">Wedding Event</option>
            <option value="Birthday Event">Birthday Event</option>
            <option value="Special Event">Special Event</option>
          </select>
        </div>
        <div>
          <label>No Of Packs:</label>
          <input
            type="number"
            name="numberOfPack"
            value={formData.numberOfPack}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Specific Note:</label>
          <textarea
            name="specificNote"
            value={formData.specificNote}
            onChange={handleInputChange}
          ></textarea>
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default MakeReservation;
