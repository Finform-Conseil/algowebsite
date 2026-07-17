"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BaseModal } from "../../common/primitives/BaseModal";
import {
  validateImageFile,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_DIMENSION,
  type ValidatedImage,
} from "../../../lib/imageNote/imageNoteValidation";

export interface ImageNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  createImageNoteDrawing: (validated: ValidatedImage, transparency: number) => Promise<string | null>;
}

const formatBytes = (n: number): string => `${(n / 1_000_000).toFixed(0)} MB`;

export const ImageNoteModal: React.FC<ImageNoteModalProps> = ({
  isOpen,
  onClose,
  createImageNoteDrawing,
}) => {
  const [validated, setValidated] = useState<ValidatedImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transparency, setTransparency] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setValidated(null);
    setTransparency(0);
    setError(null);
    setBusy(false);
    setDragOver(false);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  useEffect(() => {
    if (!isOpen) reset();
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [isOpen, reset]);

  const applyFile = useCallback(async (file: File | null | undefined) => {
    setError(null);
    const result = await validateImageFile(file);
    if (!result.ok) {
      setValidated(null);
      setPreviewUrl(null);
      setError(result.error.message);
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(result.value.file);
    objectUrlRef.current = url;
    setPreviewUrl(url);
    setValidated(result.value);
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null | undefined) => {
      if (files && files.length > 0) void applyFile(files[0]);
    },
    [applyFile]
  );

  const handleOk = useCallback(async () => {
    if (!validated || busy) return;
    setBusy(true);
    try {
      const id = await createImageNoteDrawing(validated, transparency);
      if (id) {
        reset();
        onClose();
      } else {
        setError("Impossible de créer l'image sur le graphique.");
      }
    } catch {
      setError("Une erreur est survenue lors de la création.");
    } finally {
      setBusy(false);
    }
  }, [validated, busy, transparency, createImageNoteDrawing, onClose, reset]);

  const handleCancel = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Image"
      maxWidth="460px"
      footer={
        <div className="gp-image-note-modal__footer">
          <button type="button" className="btn btn-sm btn-outline-light" onClick={handleCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleOk}
            disabled={!validated || busy}
          >
            Ok
          </button>
        </div>
      }
    >
      <div className="gp-image-note-modal">
        <div
          className={`gp-image-note-dropzone${dragOver ? " is-dragover" : ""}${validated ? " has-preview" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="gp-image-note-preview" src={previewUrl} alt="Aperçu" />
          ) : (
            <div className="gp-image-note-dropzone__hint">
              <i className="bi bi-image me-2" aria-hidden="true" />
              <span>Cliquez pour choisir ou déposez une image ici</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg"
            className="gp-image-note-file"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        <div className="gp-image-note-meta">
          Formats : JPG, PNG ou WEBP · Limite : {formatBytes(IMAGE_MAX_BYTES)} · Dimensions max :{" "}
          {IMAGE_MAX_DIMENSION}×{IMAGE_MAX_DIMENSION} px
        </div>

        {error && (
          <div className="gp-image-note-error" role="alert">
            {error}
          </div>
        )}

        <div className="gp-image-note-transparency">
          <label htmlFor="image-note-transparency">Transparency</label>
          <input
            id="image-note-transparency"
            type="range"
            min={0}
            max={100}
            value={transparency}
            onChange={(e) => setTransparency(Number(e.target.value))}
          />
          <span className="gp-image-note-transparency__value">{transparency}</span>
        </div>
      </div>
    </BaseModal>
  );
};
