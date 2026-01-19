import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './RegistrationForm.css'

const RegistrationForm = ({ submitFunction }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    callSign: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData(prevData => ({ ...prevData, [name]: value }))
  }

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 number, 1 special character
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
    return regex.test(password)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 8 characters long, include 1 uppercase letter, 1 number, and 1 special character (@$!%*?&#).')
      return
    }

    setLoading(true)
    try {
      await submitFunction(formData)
      navigate('/dashboard') // redirect after successful registration
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="signupView">
      <div id="signupCard">
        <div id="signupHeader">
          <h2 id="signupTitle">Create GroundCTRL Account</h2>
          <p id="signupSubtitle">Register to start your virtual satellite missions</p>
        </div>

        <form id="signupForm" onSubmit={handleSubmit}>
          <div className="formField">
            <label className="formLabel" htmlFor="email">Email</label>
            <input
              id="email"
              className="textInput"
              type="email"
              name="email"
              placeholder="Enter your email"
              onChange={handleChange}
              value={formData.email}
              required
            />
          </div>

          <div className="formField">
            <label className="formLabel" htmlFor="password">Password</label>
            <input
              id="password"
              className="textInput"
              type="password"
              name="password"
              placeholder="Create a password"
              onChange={handleChange}
              value={formData.password}
              required
            />
          </div>

          <div className="formField">
            <label className="formLabel" htmlFor="callSign">Pilot Call Sign</label>
            <input
              id="callSign"
              className="textInput"
              type="text"
              name="callSign"
              placeholder="e.g., Pilot-X123"
              onChange={handleChange}
              value={formData.callSign}
              required
            />
          </div>

          {error && <p className="errorMsg">{error}</p>}

          <div className="formActions">
            <button type="submit" className="actionBtn saveBtn" disabled={loading}>
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="loginPrompt">
          Already have an account? <Link to="/login" className="loginLink">Sign in here</Link>
        </p>
      </div>
    </div>
  )
}

export default RegistrationForm
