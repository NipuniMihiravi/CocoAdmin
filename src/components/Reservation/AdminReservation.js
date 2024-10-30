import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import DatePicker from 'react-datepicker'; // Import DatePicker
import { jsPDF } from 'jspdf'; // Import jsPDF
import html2canvas from 'html2canvas'; // Import html2canvas
import 'react-datepicker/dist/react-datepicker.css'; // Import CSS for DatePicker
import './Reservation.css'; // Import CSS file for styling

Modal.setAppElement('#root'); // Set the app root element for accessibility

const AdminReservation = () => {
    const [reservations, setReservations] = useState([]);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [startDate, setStartDate] = useState(null); // Start date for filtering
    const [endDate, setEndDate] = useState(null); // End date for filtering
    const [searchTerm, setSearchTerm] = useState(""); // Search term
    const [isDateRangeSelected, setIsDateRangeSelected] = useState(false); // Track if date range is selected
    const API_URL = 'https://cocoback-6.onrender.com/api/reservation';


    useEffect(() => {
        fetchReservations();

        // Set up pinging every 5 minutes (300000 ms)
        const intervalId = setInterval(() => {
            axios.get(API_URL)
                .then(() => console.log('Ping successful'))
                .catch(error => console.error('Ping failed:', error));
        }, 300000); // Ping every 5 minutes

        return () => clearInterval(intervalId); // Clear interval on component unmount
    }, []);

    const fetchReservations = async () => {
        try {
            const response = await axios.get(API_URL);
            console.log("API Response:", response.data);
            setReservations(response.data);
        } catch (error) {
            console.error("Error fetching reservations:", error);
        }
    };


    const filterReservations = () => {
        return reservations.filter((reservation) => {
            const reservationDate = new Date(reservation.reservationDate);
            const isWithinDateRange = (!startDate || reservationDate >= startDate) && (!endDate || reservationDate <= endDate);
            const matchesSearchTerm = searchTerm === "" || Object.values(reservation).some(value =>
                value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            );
            return isWithinDateRange && matchesSearchTerm;
        });
    };

    const openModal = (reservation, editMode = false) => {
        setSelectedReservation(reservation);
        setIsEditing(editMode);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedReservation(null);
        setIsEditing(false);
    };



const handleEdit = async (updatedReservation) => {
    const confirmEdit = window.confirm("Are you sure you want to make this change?");

    if (confirmEdit) {
        try {
            await axios.put(`${API_URL}/${updatedReservation.id}`, updatedReservation);
            fetchReservations();
            closeModal();
            window.location.reload(); // Full page reload
        } catch (error) {
            console.error("Error updating reservation:", error);
        }
    }
};

const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this reservation?");

    if (confirmDelete) {
        try {
            await axios.delete(`${API_URL}/${id}`); // Adjust the API endpoint
            fetchReservations(); // Refresh the reservation list
        } catch (error) {
            console.error("Error deleting reservation:", error);
        }
    }
};

    // PDF generation function
    const generatePDF = async () => {
        const input = document.getElementById('reservation-table');
        const canvas = await html2canvas(input);
        const data = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        pdf.addImage(data, 'PNG', 0, 0);
        pdf.save(`reservations_${startDate.toLocaleDateString()}_${endDate.toLocaleDateString()}.pdf`);
    };

    const calculateServiceCharge = () => {
        if (!selectedReservation) return 0;

        const buffetPrice = selectedReservation.buffetPrice || 0;
        const numberOfPacks = selectedReservation.numberOfPack || 0;

        return (buffetPrice * numberOfPacks) * 0.10; // 10% service charge
    };

    const calculateTotal = () => {
        if (!selectedReservation) return 0;

        const buffetTotal = selectedReservation.buffetPrice * selectedReservation.numberOfPack;
        const serviceCharge = calculateServiceCharge();
        const additionalMealsTotal = selectedReservation.additionalMeals?.reduce((total, meal) => {
            return total + (meal.unitPrice * meal.quantity);
        }, 0) || 0;

        return buffetTotal + serviceCharge + additionalMealsTotal; // Total includes buffet total, service charge, and additional meals total
    };

    const calculateDuePayment = () => {
        if (!selectedReservation) return 0;

        const totalPrice = calculateTotal();
        const payment = selectedReservation.payment || 0;
        const advancePayment = selectedReservation.advancePayment || 0;

        return totalPrice - payment - advancePayment; // Total Price - (Payment + Advance Payment)
    };

    const filteredReservations = filterReservations();

    // Check if a date range is selected
    useEffect(() => {
        if (startDate && endDate) {
            setIsDateRangeSelected(true);
        } else {
            setIsDateRangeSelected(false);
        }
    }, [startDate, endDate]);

    return (
        <div className="date-calender-container">
            <h2>Reservation Management</h2>

            {/* Date Range Selection */}
            <div className="date-range">
                <DatePicker
                    selected={startDate}
                    onChange={date => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Select Start Date"
                />
                <DatePicker
                    selected={endDate}
                    onChange={date => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Select End Date"
                />
            </div>

            {/* Search Functionality */}
            <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />

            <button className="generate-pdf-button" onClick={generatePDF}>
              Generate PDF
            </button>

            {isDateRangeSelected && ( // Conditional rendering for the table
                <table id="reservation-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Reservation Date</th>
                            <th>Number of Packs</th>
                            <th>Event</th>
                            <th>Time Slot</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReservations.length > 0 ? (
                            filteredReservations.map((reservation) => (
                                <tr key={reservation.id}>
                                    <td>{reservation.fullName}</td>
                                    <td>{reservation.reservationDate}</td>
                                    <td>{reservation.numberOfPack}</td>
                                    <td>{reservation.event}</td>
                                    <td>{reservation.timeSlot}</td>
                                    <td>{reservation.status}</td>
                                    <td>
                                        <button onClick={() => openModal(reservation)}>View</button>
                                        <button onClick={() => openModal(reservation, true)}>Edit</button>
                                        <button onClick={() => handleDelete(reservation.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7">No reservations found for the selected criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

      <Modal isOpen={modalIsOpen} onRequestClose={closeModal}>
      <div className="modal-content">
      <button className="close-button" onClick={closeModal}>X</button> {/* Close button */}
                      {isEditing ? (
                          <div>
                              <h2>Edit Reservation</h2>
                              <form onSubmit={(e) => {
                                  e.preventDefault();
                                  handleEdit(selectedReservation);
                              }}>
                                  <div className="form-row">
                                      <label>Name:</label>
                                      <input
                                          type="text"
                                          value={selectedReservation?.fullName || ''}
                                          onChange={(e) => setSelectedReservation({ ...selectedReservation, fullName: e.target.value })}
                                      />
                                  </div>
                                  <div className="form-row">
                                      <label>Email:</label>
                                      <input
                                          type="email"
                                          value={selectedReservation?.email || ''}
                                          onChange={(e) => setSelectedReservation({ ...selectedReservation, email: e.target.value })}
                                      />
                                  </div>
                                  <div className="form-row">
                                      <label>Contact No:</label>
                                      <input
                                          type="text"
                                          value={selectedReservation?.contactNo || ''}
                                          onChange={(e) => setSelectedReservation({ ...selectedReservation, contactNo: e.target.value })}
                                      />
                                  </div>


                                  <div className="form-row">
                                      <label>Number of Packs:</label>
                                      <input
                                          type="number"
                                          value={selectedReservation?.numberOfPack || ''}
                                          onChange={(e) => setSelectedReservation({ ...selectedReservation, numberOfPack: e.target.value })}
                                      />
                                  </div>
                                  <div className="form-row">
                                                                            <label>Event:</label>
                                                                            <select
                                                                                value={selectedReservation?.event || ''}
                                                                                onChange={(e) => setSelectedReservation({ ...selectedReservation, event: e.target.value })}
                                                                            >
                                                                                <option value="">Select Time Slot</option>
                                                                                <option value="Wedding">Wedding Event</option>
                                                                                <option value="Birthday Event">Birthday Event</option> {/* Corrected the closing tag here */}
                                                                                <option value="Special Event">Special Event</option>
                                                                                <option value="Day Outing">Day Outing</option>
                                                                            </select>
                                                                        </div>
                                  <div className="form-row">
                                      <label>Message:</label>
                                      <textarea
                                          value={selectedReservation?.message || ''}
                                          onChange={(e) => setSelectedReservation({ ...selectedReservation, message: e.target.value })}
                                      />
                                  </div>
                                  <div className="form-row">
                                      <label>Buffet:</label>
                                      <select
                                          value={selectedReservation?.buffet || ''}
                                          onChange={(e) => setSelectedReservation({ ...selectedReservation, buffet: e.target.value })}
                                      >
                                          <option value="">Select Buffet</option>
                                          <option value="buffet1">Buffet 1</option>
                                          <option value="buffet2">Buffet 2</option>
                                          <option value="buffet3">Buffet 3</option>
                                          <option value="buffet4">Buffet 4</option>
                                          <option value="buffet5">Buffet 5</option>
                                          <option value="buffet6">Customize Buffet</option>
                                      </select>
                                  </div>
                                  <div className="form-row">
                                      <label>Buffet Price:</label>
                                      <input
                                          type="number"
                                          value={selectedReservation?.buffetPrice || ''}
                                          onChange={(e) => setSelectedReservation({ ...selectedReservation, buffetPrice: e.target.value })}
                                      />
                                  </div>
                                  <div className="form-row">
                                      <label>Service Charge:</label>
                                      <input
                                          type="number"
                                          value={calculateServiceCharge() || 0}
                                          readOnly
                                      />
                                  </div>
                                  <div className="form-row">
                                      <label>Total Price:</label>
                                      <input
                                          type="number"
                                          value={calculateTotal() || 0}
                                          readOnly
                                      />
                                  </div>
                                  <div className="form-row">
                                      <label>Advance Payment:</label>
                                      <input
                                          type="number"
                                          value={selectedReservation?.advancePayment || ''}
                                          onChange={(e) => setSelectedReservation({ ...selectedReservation, advancePayment: e.target.value })}
                                      />
                                  </div>
                                  <div className="form-row">
                                      <label>Payment:</label>
                                      <input
                                          type="number"
                                          value={selectedReservation?.payment || ''}
                                          onChange={(e) => setSelectedReservation({ ...selectedReservation, payment: e.target.value })}
                                      />
                                  </div>
                                  <div className="form-row">
                                                                  <label>Due Payment:</label>
                                                                  <input
                                                                      type="number"
                                                                      value={calculateDuePayment() || 0}
                                                                      readOnly
                                                                  />
                                                              </div>

                                                              <div className="form-row">
                                                                                                    <label>Status:</label>
                                                                                                    <select
                                                                                                        value={selectedReservation?.status || ''}
                                                                                                        onChange={(e) => setSelectedReservation({ ...selectedReservation, status: e.target.value })}
                                                                                                    >
                                                                                                        <option value="">Select Status</option>
                                                                                                        <option value="Pending">Pending</option>
                                                                                                        <option value="Confirm">Confirm</option>
                                                                                                        <option value="Reject">Reject</option>

                                                                                                    </select>
                                                                                                </div>

                                  <div className="form-row">
                                                                  <label>Special Notes 1:</label>
                                                                  <textarea
                                                                      value={selectedReservation.specialNote1}
                                                                      onChange={(e) => setSelectedReservation({ ...selectedReservation, specialNote1: e.target.value })}
                                                                  />
                                                              </div>
                                                              <div className="form-row">
                                                                                              <label>Special Notes 2:</label>
                                                                                              <textarea
                                                                                                  value={selectedReservation.specialNote2}
                                                                                                  onChange={(e) => setSelectedReservation({ ...selectedReservation, specialNote2: e.target.value })}
                                                                                              />
                                                                                          </div>


                                  <button type="submit">Update Reservation</button>
                                  <button type="button" onClick={closeModal}>Cancel</button>
                              </form>
                          </div>

                      ) : (

                          <div>
                                                  <h2>Reservation Details</h2>
                                                  {/** Reservation Details */}
                                                  {[
                                                      { label: "Name", value: selectedReservation?.fullName },
                                                      { label: "Email", value: selectedReservation?.email },
                                                      { label: "Contact No", value: selectedReservation?.contactNo },
                                                      { label: "Time Slot", value: selectedReservation?.timeSlot },
                                                      { label: "Number of Packs", value: selectedReservation?.numberOfPack },
                                                      { label: "Event", value: selectedReservation?.event },
                                                      { label: "Message", value: selectedReservation?.message },
                                                      { label: "Buffet", value: selectedReservation?.buffet },
                                                      { label: "Buffet Price", value: selectedReservation?.buffetPrice },
                                                      { label: "Service Charge", value: selectedReservation?.serviceCharge },
                                                      { label: "Total Price", value: calculateTotal() },
                                                      { label: "Advance Payment", value: selectedReservation?.advancePayment },
                                                      { label: "Payment", value: selectedReservation?.payment },
                                                      { label: "Payment Method", value: selectedReservation?.paymentMethod },
                                                      { label: "Assigned By", value: selectedReservation?.assignedBy },
                                                      { label: "Special Notes 1", value: selectedReservation?.specialNote1 },
                                                      { label: "Special Notes 2", value: selectedReservation?.specialNote2 },
                                                      { label: "Status", value: selectedReservation?.status },
                                                      { label: "Reservation Date", value: selectedReservation?.reservationDate },
                                                  ].map(({ label, value }) => (
                                                      <div key={label}>
                                                          <strong>{label}:</strong> {value}
                                                      </div>
                                                  ))}

                                                  <button onClick={closeModal}>Close</button>
                                              </div>
                                          )}

  </div>
                                      </Modal>


              </div>
          );

      };


export default AdminReservation;
