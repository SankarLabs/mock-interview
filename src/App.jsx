import React, { createContext, useContext, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Setup from './pages/Setup.jsx'
import Interview from './pages/Interview.jsx'
import Results from './pages/Results.jsx'
import JobMatches from './pages/JobMatches.jsx'

export const AppContext = createContext(null)

export function useApp() {
  return useContext(AppContext)
}

const INTERVIEW_TYPES = ['System Design', 'Coding (DSA)', 'Behavioral (STAR)', 'Mixed']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const COMPANIES = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Netflix', 'Startup', 'Any']

export default function App() {
  const [resumeText, setResumeText] = useState('')
  const [resumeParsed, setResumeParsed] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [interviewType, setInterviewType] = useState('Mixed')
  const [difficulty, setDifficulty] = useState('medium')
  const [company, setCompany] = useState('Any')
  const [questions, setQuestions] = useState([])
  const [candidateProfile, setCandidateProfile] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])

  const resetSession = useCallback(() => {
    setResumeText('')
    setResumeParsed(null)
    setInterviewType('Mixed')
    setDifficulty('medium')
    setCompany('Any')
    setQuestions([])
    setCandidateProfile(null)
    setCurrentQuestionIndex(0)
    setAnswers([])
  }, [])

  const addAnswer = useCallback((result) => {
    setAnswers(prev => [...prev, result])
  }, [])

  const clearAnswers = useCallback(() => setAnswers([]), [])

  return (
    <AppContext.Provider value={{
      resumeText, setResumeText,
      resumeParsed, setResumeParsed,
      jobDescription, setJobDescription,
      interviewType, setInterviewType,
      difficulty, setDifficulty,
      company, setCompany,
      questions, setQuestions,
      candidateProfile, setCandidateProfile,
      currentQuestionIndex, setCurrentQuestionIndex,
      answers, setAnswers, addAnswer, clearAnswers,
      resetSession,
      INTERVIEW_TYPES, DIFFICULTIES, COMPANIES,
    }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<JobMatches />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/results" element={<Results />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  )
}
