//Package Imports
import { useState } from "react";

//File Imports
import LargeTextForm from "./components/LargeTextForm";

export default function CreateNewSessionScreen() {
    const [name, setName] = useState("");
    const [sessionName, setSessionName] = useState("");
    const [joinCode, setJoinCode] = useState("");

    const generateJoinCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 8; i += 1) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        setJoinCode(code);
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-[var(--accent-color)]">
            <div className="w-4/5 max-w-lg py-12 px-5 lg:px-12 bg-white shadow-lg">
                <h1 className="mt-4 text-2xl lg:text-3xl mb-1 text-center">Create a New Session</h1>
                <p className="text-md lg:text-lg mb-8 text-center text-[var(--grey-accent-medium)]">Enter your session details below.</p>

                <LargeTextForm
                    label="Name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mb-6 placeholder:text-[18px] lg:placeholder:text-base"
                />

                <LargeTextForm
                    label="Session Name"
                    placeholder="Enter session name"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="mb-6 placeholder:text-[18px] lg:placeholder:text-base"
                />

                <div className="flex flex-col mb-6">
                    <label className="text-md lg:text-lg font-medium">Join Code</label>
                    <div className="mt-1 flex gap-3">
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="Enter join code"
                            className="pl-5 py-3 border rounded-lg focus:outline-none text-md lg:text-lg flex-1 placeholder:text-[18px] lg:placeholder:text-base"
                            style={{ borderColor: "black" }}
                        />
                        <button
                            type="button"
                            onClick={generateJoinCode}
                            className="bg-[var(--green-accent)] text-white text-md lg:text-lg px-4 py-3 rounded-sm cursor-pointer"
                        >
                            Generate
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 mb-6">
                    <button className="flex-1 bg-[var(--grey-accent-medium)] text-white text-md lg:text-lg py-3 rounded-sm cursor-pointer">
                        Custom Tags
                    </button>
                    <button className="flex-1 bg-[var(--grey-accent-medium)] text-white text-md lg:text-lg py-3 rounded-sm cursor-pointer">
                        Default Tags
                    </button>
                </div>

                <button className="mt-2 w-full bg-[var(--green-accent)] text-white text-lg py-3 px-4 rounded-sm cursor-pointer">
                    Create Session
                </button>
            </div>
        </div>
    );
}
