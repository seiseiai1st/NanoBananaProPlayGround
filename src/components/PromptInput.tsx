import { useState, useRef, type DragEvent } from 'react';
import './PromptInput.css';

interface ReferenceImage {
    base64: string;
    mimeType: string;
    name: string;
    size: number;
}

interface PromptInputProps {
    prompt: string;
    onPromptChange: (prompt: string) => void;
    referenceImage: ReferenceImage | null;
    onReferenceImageChange: (img: ReferenceImage | null) => void;
    onGenerate: () => void;
    isLoading: boolean;
    canGenerate: boolean;
}

/**
 * プロンプト入力 & 参照画像アップロードコンポーネント
 */
export default function PromptInput({
    prompt,
    onPromptChange,
    referenceImage,
    onReferenceImageChange,
    onGenerate,
    isLoading,
    canGenerate,
}: PromptInputProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /** ファイルをBase64に変換して状態に設定 */
    const handleFile = (file: File) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
        if (!allowedTypes.includes(file.type)) {
            alert('対応形式: PNG, JPEG, WebP, HEIC, HEIF');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            /* data:image/png;base64,XXXX から base64 部分だけ取得 */
            const base64 = dataUrl.split(',')[1];
            onReferenceImageChange({
                base64,
                mimeType: file.type,
                name: file.name,
                size: file.size,
            });
        };
        reader.readAsDataURL(file);
    };

    const onDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => setIsDragging(false);

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    /** ファイルサイズを読みやすい文字列に変換 */
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    /** Enter + Ctrl/Cmd で生成 */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canGenerate && !isLoading) {
            onGenerate();
        }
    };

    return (
        <div className="prompt-input-panel glass-panel">
            <h2>🎨 画像生成</h2>

            {/* プロンプト */}
            <div className="settings-group">
                <label>プロンプト</label>
                <textarea
                    className="prompt-textarea"
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="生成したい画像を詳しく記述してください..."
                    disabled={isLoading}
                />
            </div>

            {/* 参照画像 */}
            <div className="settings-group">
                <label>参照画像（オプション）</label>
                {referenceImage ? (
                    <div className="reference-preview">
                        <img
                            src={`data:${referenceImage.mimeType};base64,${referenceImage.base64}`}
                            alt="参照画像"
                        />
                        <div className="reference-info">
                            <span className="filename">{referenceImage.name}</span>
                            <span className="filesize">{formatFileSize(referenceImage.size)}</span>
                        </div>
                        <button
                            className="reference-remove"
                            onClick={() => onReferenceImageChange(null)}
                        >
                            ✕ 削除
                        </button>
                    </div>
                ) : (
                    <div
                        className={`dropzone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="dropzone-label">
                            <span className="dropzone-icon">📁</span>
                            <span className="dropzone-text">
                                ドラッグ＆ドロップ または クリックで選択
                            </span>
                            <span className="dropzone-hint">
                                PNG, JPEG, WebP, HEIC, HEIF
                            </span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
                            onChange={onFileSelect}
                        />
                    </div>
                )}
            </div>

            {/* 生成ボタン */}
            <button
                className={`generate-btn ${isLoading ? 'loading' : ''}`}
                onClick={onGenerate}
                disabled={!canGenerate || isLoading}
            >
                {isLoading ? (
                    <>
                        <span className="btn-spinner" />
                        生成中...
                    </>
                ) : (
                    '✨ 画像を生成'
                )}
            </button>
        </div>
    );
}
