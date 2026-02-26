import React, { useRef, useState, useEffect } from "react";
import api from "../../api/axios";

export default function FaceAttendanceSection({
    classId,
    subjectId,
    date,
    onClose,
    showToast
}) {

    const videoRef = useRef(null);
    const [running, setRunning] = useState(false);
    const [lastMatch, setLastMatch] = useState(null);
    const markedStudentsRef = useRef(new Set());
    const warnedStudentsRef = useRef(new Set());
    const processingRef = useRef(false);

    async function startCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setRunning(true);
    }

    async function stopCamera() {

        const tracks = videoRef.current?.srcObject?.getTracks();
        tracks?.forEach(t => t.stop());

        setRunning(false);

        //  Automatically finalize attendance
        try {

            await api.post("/teacher/finalize-face-attendance", {
                class_id: classId,
                subject_id: subjectId,
                session_date: date
            });

            showToast("Attendance finalized. Absentees marked.", "success");

        } catch (err) {
            showToast("Failed to finalize attendance", "error");
        }

        onClose();
    }

    async function finalizeAttendance() {
        try {
            await api.post("/teacher/finalize-face-attendance", {
                class_id: classId,
                subject_id: subjectId,
                session_date: date
            });

            showToast("Attendance finalized. Absentees marked.", "success");

            stopCamera();
            onClose();

        } catch (err) {
            showToast("Failed to finalize attendance", "error");
        }
    }

    useEffect(() => {
        let interval;

        if (running) {
            interval = setInterval(() => {
                captureAndSend();
            }, 4000); // scan every 2.5 seconds
        }

        return () => clearInterval(interval);
    }, [running]);

    async function captureAndSend() {

        if (processingRef.current) return;
        processingRef.current = true;

        try {

            const video = videoRef.current;
            const canvas = document.createElement("canvas");

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0);

            const blob = await new Promise(resolve =>
                canvas.toBlob(resolve, "image/jpeg", 0.7)
            );

            const formData = new FormData();
            formData.append("image", blob);
            formData.append("class_id", Number(classId));
            formData.append("subject_id", Number(subjectId));
            formData.append("session_date", date);

            const res = await api.post("/teacher/face-attendance", formData);

            if (res.data.matched) {

                if (!markedStudentsRef.current.has(res.data.student_id)) {

                    markedStudentsRef.current.add(res.data.student_id);

                    showToast(
                        `✔ ${res.data.student_name} marked`,
                        "success"
                    );
                }
            }

        } catch (err) {
            console.error(err);
        }

        processingRef.current = false;
    }

    return (
        <div className="p-4 border rounded-xl bg-white/80 space-y-3">

            <video
                ref={videoRef}
                autoPlay
                className="w-[380px] h-[280px] mx-auto rounded-xl object-cover shadow"
            />

            <div className="flex gap-2">
                {!running ? (
                    <button
                        onClick={startCamera}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl"
                    >
                        Start Auto Scan
                    </button>
                ) : (
                    <button
                        onClick={stopCamera}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl"
                    >
                        Stop
                    </button>
                )}
            </div>

            {lastMatch && (
                <div className="text-sm text-slate-700">
                    Last: {lastMatch.student_name} ({lastMatch.confidence})
                </div>
            )}

            <button
                onClick={() => {
                    stopCamera();
                    onClose();
                }}
                className="text-xs text-slate-500"
            >
                Close
            </button>
        </div>
    );
}