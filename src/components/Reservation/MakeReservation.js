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
    numberOfPack:"",
    specificNote: ""
  });

  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isFullDayBooked, setIsFullDayBooked] = useState(false);
  const [reservationDate, setReservationDate] = useState({});
  const [dateColors, setDateColors] = useState({});
  const API_URL = process.env.REACT_APP_API_URL; // Fetch the API URL from environment variable

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Fetch availability based on the selected date
  useEffect(() => {
    if (reservationDate) {
      checkAvailability(reservationDate);
    }
  }, [reservationDate]);

  // Function to check availability from the backend
  const checkAvailability = async (date) => {
    try {
          // Convert date to ISO string format for the request
          const formattedDate = new Date(date).toISOString().split('T')[0];
          const response = await axios.get(`${API_URL}/api/reservation/checkAvailability?reservationDate=${formattedDate}`);
          const reservations = response.data;


      // Check if the full day is booked
      const fullDayBooked = reservations.some(
        (reservation) => reservation.timeSlot === "full"
      );
      if (fullDayBooked) {
        setIsFullDayBooked(true);
        setAvailableTimeSlots([]);
        return;
      }

      setIsFullDayBooked(false);

      const bookedTimeSlots = reservations.map(
        (reservation) => reservation.timeSlot
      );

      const isDayBooked = bookedTimeSlots.includes("Day Time");
      const isNightBooked = bookedTimeSlots.includes("Night Time");

      if (isDayBooked && isNightBooked) {
        setAvailableTimeSlots([]);
        return;
      }

      if (isDayBooked || isNightBooked) {
        setAvailableTimeSlots(isDayBooked ? ["Night Time"] : ["Day Time"]);
        return;
      }

      setAvailableTimeSlots(["Day Time", "Night Time", "Full Time"]);
    } catch (error) {
      console.error("Error checking availability", error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("${API_URL}/api/reservation", formData);
      if (response.status === 200) {
        alert("Reservation submitted successfully!");
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert(
          "This time slot is already booked. Please choose a different time or date."
        );
      } else {
        console.error("Error submitting reservation", error);
      }
    }
  };

  // Fetch reservations on component mount
  useEffect(() => {
    axios.get('${API_URL}/api/reservation') // Adjust your endpoint as needed
      .then((response) => {
        const fetchedReservations = response.data;
        mapReservationToColors(fetchedReservations);
      })
      .catch((error) => {
        console.error('Error fetching reservations:', error);
      });
  }, []);

  // Function to map reservation data to colors based on timeSlot
  const mapReservationToColors = (reservations) => {
    const colors = {};

    reservations.forEach((reservation) => {
      const date = new Date(reservation.reservationDate);
      const formattedDate = date.toLocaleDateString('en-CA');

      // Check the status first
      if (reservation.status === 'Advance' || reservation.status === 'Confirm') {
        // Existing logic for time slots
        if (reservation.timeSlot === 'Full Time') {
          colors[formattedDate] = 'red'; // Fully booked
        } else if (reservation.timeSlot === 'Day Time') {
          colors[formattedDate] = colors[formattedDate] === 'pink' ? 'red' : 'yellow'; // If night is also booked, make it red
        } else if (reservation.timeSlot === 'Night Time') {
          colors[formattedDate] = colors[formattedDate] === 'yellow' ? 'red' : 'pink'; // If day is also booked, make it red
        }
      }
    });

    setDateColors(colors);
  };

  // Function to render calendar tiles with colors
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const formattedDate = date.toLocaleDateString('en-CA'); // Format the date to 'YYYY-MM-DD' in local time
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
            onChange={(e) => {
              handleInputChange(e);
              setReservationDate(e.target.value);
            }}
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
              <option value="Day Time">Day Time</option>
              <option value="Night Time">Night Time</option>
              <option value="Full Time">Full Time</option>
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
               type="number" // Change this to 'number' to allow only numeric input
               name="numberOfPack" // Use a consistent name
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
