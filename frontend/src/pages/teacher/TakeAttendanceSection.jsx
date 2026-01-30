import React, { useEffect, useState } from "react";
import api, { fetchTeacherClasses } from "../../api/axios";
import AttendanceTable from "../../components/AttendanceTable";
// import ConfirmModal from "../../components/ConfirmModal";
import Toast from "../../components/Toast";

export default function TakeAttendanceSection({ onDone, glassCard, showToast }) {
  const [students, setStudents] = useState([]);
  const [values, setValues] = useState({});
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // 1️ Load teacher classes
  useEffect(() => {
    async function loadClasses() {
      try {
        const cls = await fetchTeacherClasses();
        setClasses(cls || []);
        if (cls && cls.length > 0) {
          setClassId(cls[0].id);
        }
      } catch (err) {
        setToast({ message: "Could not load your classes", variant: "error" });
      }
    }
    loadClasses();
  }, []);

  // 2️ Load students when class changes
  useEffect(() => {
    async function loadStudents() {
      if (!classId) {
        setStudents([]);
        setValues({});
        return;
      }
      setLoadingStudents(true);
      try {
        const res = await api.get(`/teacher/classes/${classId}/students`);
        const data = res.data?.data || [];
        setStudents(data);

        const map = {};
        data.forEach((s) => {
          map[s.id] = "ABSENT";
        });
        setValues(map);
      } catch (err) {
        setStudents([]);
        setValues({});
        setToast({
          message: err.response?.data?.error || "Could not load students",
          variant: "error",
        });
      } finally {
        setLoadingStudents(false);
      }
    }
    loadStudents();
  }, [classId]);

  function setValue(studentId, status) {
    setValues((prev) => ({ ...prev, [studentId]: status }));
  }

  function openConfirm() {
    if (!classId) {
      setToast({ message: "Select a class first", variant: "error" });
      return;
    }
    if (students.length === 0) {
      setToast({ message: "No students in this class", variant: "error" });
      return;
    }
    setConfirmOpen(true);
  }

  // async function handleConfirm() {
  //   setConfirmOpen(false);
  //   setLoading(true);

  //   try {
  //     const records = Object.keys(values).map((k) => ({
  //       student_id: Number(k),
  //       status: values[k],
  //     }));

  //     if (records.length === 0) {
  //       setToast({ message: "No attendance data to save", variant: "error" });
  //       setLoading(false);
  //       return;
  //     }

  //     let sessionId;

  //     try {
  //       // 1️ Try to create session
  //       const res = await api.post("/teacher/sessions", {
  //         class_id: Number(classId),
  //         session_date: date,
  //       });
  //       sessionId = res.data.data.session_id;
  //     } catch (err) {
  //       // 2️ If already exists (409), reuse existing session
  //       if (err.response?.status === 409) {
  //         const year = new Date(date).getFullYear();
  //         const sessionsRes = await api.get("/teacher/sessions", {
  //           params: { class_id: Number(classId), year },
  //         });

  //         const existing = sessionsRes.data.data.find(
  //           (s) => s.session_date === date
  //         );

  //         if (!existing) {
  //           throw err;
  //         }
  //         sessionId = existing.id;
  //       } else {
  //         throw err;
  //       }
  //     }


  //     // 3️ Save attendance records
  //     await api.put(`/teacher/sessions/${sessionId}/records`, records);

  //     showToast("Attendance saved successfully", "success");
  //     onDone && onDone();

  //   } catch (err) {
  //     showToast("Failed to save attendance", "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  async function handleConfirm() {
    setConfirmOpen(false);
    setLoading(true);

    let sessionId = null;

    try {
      const records = Object.keys(values).map((k) => ({
        student_id: Number(k),
        status: values[k],
      }));

      if (records.length === 0) {
        showToast("No attendance data to save", "error");
        return;
      }

      // 🔹 STEP 1: Ensure session (NO TOAST HERE)
      try {
        const res = await api.post("/teacher/sessions", {
          class_id: Number(classId),
          session_date: date,
        });
        sessionId = res.data.data.session_id;

      } catch (err) {
        if (err.response?.status === 409) {
          // ✅ SESSION EXISTS — get it
          const year = new Date(date).getFullYear();

          const sessionsRes = await api.get("/teacher/sessions", {
            params: {
              class_id: Number(classId),
              year: Number(year),
            },
          });

          const existing = sessionsRes.data.data.find(
            (s) =>
              s.session_date === date &&
              s.class_id === Number(classId)
          );


          if (!existing) {
            throw new Error("Session exists but not found");
          }

          sessionId = existing.id;
        } else {
          throw err;
        }
      }

      // 🔹 STEP 2: SAVE ATTENDANCE (ONLY THIS DECIDES SUCCESS)
      const res = await api.put(`/teacher/sessions/${sessionId}/records`, records);

      // treat 200–299 as success
      if (res.status >= 200 && res.status < 300) {
        showToast("Attendance saved successfully", "success");
        onDone && onDone();
      }

      onDone && onDone();

    } catch (err) {
      console.error("Attendance error:", err);
      showToast(
        err?.response?.data?.error || "Failed to save attendance",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className={glassCard + " p-4 sm:p-6"}>
      <div className="flex justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Take Attendance</h2>
          <p className="text-sm text-slate-600">
            Select class and mark students present / absent
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap">
        <div className="flex flex-col">
          <label className="text-xs text-slate-600 mb-1">Class</label>
          <select
            value={classId}
            onChange={(e) => setClassId(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm bg-white/80 border-slate-200"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section ? `- ${c.section}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-slate-600 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white/80 border-slate-200"
          />
        </div>
      </div>


      {/* Table */}
      <div className="min-h-[120px]">
        {loadingStudents ? (
          <p className="text-sm text-center text-slate-500">
            Loading students...
          </p>
        ) : students.length > 0 ? (
          <AttendanceTable
            students={students}
            values={values}
            setValue={setValue}
          />
        ) : (
          <p className="text-sm text-center text-slate-500">
            No students found
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={openConfirm}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Attendance"}
        </button>
        <button
          onClick={() => onDone && onDone()}
          className="px-4 py-2 border rounded-xl text-sm bg-white/70"
        >
          Cancel
        </button>
      </div>

      <SimpleConfirm
        open={confirmOpen}
        title="Confirm Submit"
        message="Are you sure you want to save this attendance?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />


      {/* Inline confirm bar
      {confirmOpen && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="text-xs sm:text-sm text-amber-800 flex-1">
            Are you sure you want to save attendance for this class and date?
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-amber-200 text-xs sm:text-sm text-amber-800 bg-white hover:bg-amber-50"
            >
              No
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm disabled:opacity-60"
            >
              {loading ? "Saving..." : "Yes, Save"}
            </button>
          </div>
        </div>
      )} */}


      {/* <ConfirmModal
        open={confirmOpen}
        title="Confirm Submit"
        message="Are you sure you want to save this attendance?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      /> */}
    </div>
  );
}


function SimpleConfirm({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
          {title || "Confirm"}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mb-4">
          {message || "Are you sure?"}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
