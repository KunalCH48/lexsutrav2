"use client";

import { useState } from "react";
import { Shield, CheckCircle } from "lucide-react";
import { ReviewerSignModal } from "./ReviewerSignModal";

type Props = {
  diagnosticId:  string;
  reviewerName:  string;
  credential:    string | null;
  alreadySigned: boolean;
  approvedAt:    string | null;
};

export function ReviewerSignButton({ diagnosticId, reviewerName, credential, alreadySigned, approvedAt }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [signed,    setSigned]    = useState(alreadySigned);
  const [signedAt,  setSignedAt]  = useState(approvedAt);

  function handleSigned() {
    setSigned(true);
    setSignedAt(new Date().toISOString());
  }

  if (signed) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "#2ecc71" }}>
        <CheckCircle size={14} />
        <span>
          Signed{signedAt ? ` · ${new Date(signedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg"
        style={{
          background: "rgba(46,204,113,0.1)",
          color:      "#2ecc71",
          border:     "1px solid rgba(46,204,113,0.25)",
        }}
      >
        <Shield size={14} />
        Sign Report with OTP
      </button>

      {showModal && (
        <ReviewerSignModal
          diagnosticId={diagnosticId}
          reviewerName={reviewerName}
          credential={credential}
          alreadySigned={signed}
          approvedAt={signedAt}
          onClose={() => setShowModal(false)}
          onSigned={handleSigned}
        />
      )}
    </>
  );
}
