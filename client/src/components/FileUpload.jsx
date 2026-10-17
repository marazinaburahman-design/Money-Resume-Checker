import { useRef, useState } from 'react';

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

export default function FileUpload({
  selectedFile,
  onFileSelect,
  onFileRemove,
  error,
  disabled,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleValidateAndSelect = (file) => {
    if (!file) return;

    // Check PDF extension or MIME type
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      onFileSelect(null, 'Only PDF files are supported. Please upload a .pdf document.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onFileSelect(
        null,
        `File is too large (${formatFileSize(file.size)}). Maximum allowed size is 4 MB.`
      );
      return;
    }

    onFileSelect(file, null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleValidateAndSelect(file);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    handleValidateAndSelect(file);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          Resume Document <span className="text-violet-400">*</span>
        </label>
        <span className="text-xs text-zinc-500 font-medium">PDF only, maximum 4 MB</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* Selected File State */}
      {selectedFile ? (
        <div className="flex items-center justify-between p-4 bg-[#151924] border border-zinc-800 rounded-xl transition-all duration-200">
          <div className="flex items-center gap-3.5 overflow-hidden">
            {/* PDF Icon */}
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 2h6l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm2 8h6v2H9v-2zm0 4h4v2H9v-2z"/>
                <path d="M13 2v4a2 2 0 0 0 2 2h4"/>
              </svg>
            </div>

            <div className="truncate">
              <p className="text-sm font-semibold text-zinc-100 truncate">
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                <span>{formatFileSize(selectedFile.size)}</span>
                <span className="text-zinc-600">•</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Success
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/90 hover:bg-zinc-700 hover:text-white border border-zinc-700/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            >
              Replace
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={onFileRemove}
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
              title="Remove file"
              aria-label="Remove selected resume"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer select-none focus-visible:outline-none ${
            isDragging
              ? 'border-violet-500 bg-violet-950/20'
              : 'border-zinc-700/80 bg-[#131622]/60 hover:border-zinc-500 hover:bg-[#161a28]/80'
          } ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-violet-500'
          }`}
          aria-label="Drop your resume here or click to browse files"
        >
          {/* Upload Icon */}
          <div className="w-11 h-11 rounded-xl bg-zinc-800/90 border border-zinc-700/70 text-violet-400 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <p className="text-sm font-medium text-zinc-200">
            Drop your resume here <span className="text-violet-400 font-semibold">or browse files</span>
          </p>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            PDF only, maximum 4 MB
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-950/30 border border-rose-900/60 rounded-lg text-xs text-rose-300 font-medium">
          <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
