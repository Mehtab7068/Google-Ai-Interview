import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createSession } from '../features/sessions/sessionSlice';

function CreateSession() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleStartSession = async (sessionData) => {
    try {
      const res = await dispatch(createSession(sessionData)).unwrap();
      const id = res?._id || res?.sessionId || res?.id;

      if (id && id !== 'undefined') {
        navigate(`/interview/${id}`);
      } else {
        toast.error("Session created but ID was missing. Try again.");
      }
    } catch (err) {
      toast.error(err || "Failed to start interview session.");
    }
  };

  return (
    <button onClick={() => handleStartSession({ role: "MERN Stack Developer" })}>
      Start Interview
    </button>
  );
}

export default CreateSession;