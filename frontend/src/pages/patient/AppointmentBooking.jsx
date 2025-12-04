import { useState } from "react";
import "./dashboard.css";

export default function AppointmentBooking({ onCancel, onSuccess }){
    const [doctorEmail, setDoctorEmail] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // generate time slot from 9 to 5, hourly
    const timeSlots = [];
    for(let hour = 9; hour < 17; hour++) {
        const start = hour;
        const end = hour + 1;
        const startStr = hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
        const endStr = end === 12 ? "12 PM" : end > 12 ? `${end - 12} PM` : `${end} AM`;

        timeSlots.push({ 
            display: `${startStr} - ${endStr}`, //ex: 9AM-10AM
            hour: start,
            value: `${start}`
            });
    }
    
    // Get today's date in YYYY-MM-DD format for min date
    const today = new Date().toISOString().split('T')[0];

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!doctorEmail.trim()) {
            setError("Please enter doctor's email address");
            return;
        }

        if (!selectedDate) {
            setError("Please select a date");
            return;
        }

        if (!selectedSlot) {
        setError("Please select a time slot");
        return;
        }

        setSubmitting(true);

        try{
            // Create ISO datetime string
            const requestedTime = `${selectedDate}T${String(selectedSlot).padStart(2, '0')}:00:00Z`;

            const token = localStorage.getItem("token");
            const res = await fetch("/appointments/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` //sends your login token so the server knows who you are and that you're allowed to make appointments
                },
                body: JSON.stringify({
                    doctor_email: doctorEmail.trim().toLowerCase(),
                    requested_time: requestedTime,
                    reason: reason.trim() || ""
                })
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            if (onSuccess) onSuccess(); //refreshes appointments and closes the booking page

        } else {
            setError(data.error || "Failed to create appointment request");
        }
    } catch (err) {
    setError(String(err));
    } finally {
    setSubmitting(false); // re-enable the form button
    }
}

    return (
    <div className="pd-page-appointment-only">
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <div className="survey-container">
          <h2 className="survey-title" style={{ textAlign: 'center' }}>Book New Appointment</h2>
          
          <div className="survey-background">
            <p className="survey-subtitle" style={{ textAlign: 'center' , color: 'black'}}>Request an appointment with your doctor</p>

            {error && <div className="pd-error" style={{ marginBottom: '20px' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* Email and Date in 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="survey-question" style={{ margin: 0 }}>
                  <label className="survey-label">
                    Doctor's Email <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="survey-input"
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="survey-question" style={{ margin: 0 }}>
                  <label className="survey-label">
                    Appointment Date <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="survey-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={today}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Time slots - full width */}
              <div className="survey-question">
                <label className="survey-label">
                  Preferred Time Slot <span style={{ color: 'red' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '12px' }}>
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      // selectedSlot = Only ONE value is stored in selectedSlot at a time
                      className={`time-slot-btn ${selectedSlot === slot.value ? 'selected' : ''}`}
                      // when you click a button, it replaces the current value
                      onClick={() => setSelectedSlot(slot.value)}
                      disabled={submitting}
                    >
                      {slot.display}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason - full width */}
              <div className="survey-question">
                <label className="survey-label">
                  Reason for Visit (Optional)
                </label>
                <textarea
                  className="survey-input reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your symptoms or reason for the appointment..."
                  rows="4"
                  disabled={submitting}
                  style={{ width: '100%', marginTop: '12px' }}
                />
              </div>

              {/* Buttons centered */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '30px', justifyContent: 'center', maxWidth: '500px', margin: '30px auto 0' }}>
                <button
                  type="button"
                  className="survey-btn-secondary"
                  onClick={onCancel}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="survey-btn"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Request Appointment"}
                </button>
              </div>
            </form>
          </div>
      </div>
    </div>
  </div>
  );
}