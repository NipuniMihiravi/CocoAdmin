import React, { useState } from "react";
import { FaBars, FaHome, FaUser, FaCog, FaCaretDown } from "react-icons/fa";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

import GalleryForm from './components/DashPage/GalleryForm';
import FacilityList from './components/DashPage/FacilityList';
import ContactList from './components/DashPage/ContactList';

import AdminReservation from './components/Reservation/AdminReservation';
import CalenderView from './components/Reservation/CalenderView';
import MakeReservation from './components/Reservation/MakeReservation';
import "./App.css"; // Import your custom CSS for styling

const App = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(""); // State to track active dropdown

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleDropdown = (dropdownName) => {
    // Toggle the dropdown; close if the same one is clicked, open if a new one is clicked
    setActiveDropdown(activeDropdown === dropdownName ? "" : dropdownName);
  };

  return (
    <Router>
      <div className="app">
        <div className={`sidebar ${isOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <h2>ADMIN PANEL</h2>
            <button className="toggle-btn" onClick={toggleSidebar}>
              <FaBars />
            </button>
          </div>
          <ul className="sidebar-links">
            {/* Dropdown for Home */}
            <li className="dropdown">
              <FaHome />
              <span className="dropdown-toggle" onClick={() => toggleDropdown('home')}>
                Reservation <FaCaretDown />
              </span>
              {activeDropdown === 'home' && (
                <ul className="dropdown-menu">
                  <li><Link to="/make_reservation">Make Reservation</Link></li>
                  <li><Link to="/reservation">View Reservation</Link></li>
                  <li><Link to="/calendar">Reservation Calender</Link></li>
                </ul>
              )}
            </li>



            {/* Dropdown for Settings */}
            <li className="dropdown">
              <FaCog />
              <span className="dropdown-toggle" onClick={() => toggleDropdown('settings')}>
                Website Settings <FaCaretDown />
              </span>
              {activeDropdown === 'settings' && (
                <ul className="dropdown-menu">
                <li><Link to="/query">Query Response</Link></li>
                  <li><Link to="/addgallery">Gallery Management</Link></li>
                  <li><Link to="/addfacility">Facility Management</Link></li>

                </ul>
              )}
            </li>
          </ul>
        </div>

        <div className={`main-content ${isOpen ? "shifted" : ""}`}>
          <header>
            <button className="menu-btn" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <h1>COCOLOCO GARDEN</h1>
          </header>

          {/* Main Content Area for Routes */}
          <Routes>
            <Route path="/" element={<h2>Welcome to the Admin Panel</h2>} />
            <Route path="/addfacility" element={<FacilityList />} />
            <Route path="/addgallery" element={<GalleryForm />} />
            <Route path="/query" element={<ContactList />} />
            <Route path="/reservation" element={<AdminReservation />} />
            <Route path="/calendar" element={<CalenderView />} />
           <Route path="/make_reservation" element={<MakeReservation />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
