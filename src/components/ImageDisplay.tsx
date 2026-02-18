import { downloadImage, type GeneratedImage } from '../services/api';
import './ImageDisplay.css';

interface HistoryItem {
    image: GeneratedImage;
    prompt: string;
    timestamp: number;
}

interface ImageDisplayProps {
    currentImage: GeneratedImage | null;
    isLoading: boolean;
    error: { message: string; details?: string } | null;
    history: HistoryItem[];
    onSelectHistory: (index: number) => void;
    selectedHistoryIndex: number;
}

/**
 * 生成画像表示コンポーネント
 * ローディング、エラー、画像プレビュー、ダウンロード、履歴表示を担当
 */
export default function ImageDisplay({
    currentImage,
    isLoading,
    error,
    history,
    onSelectHistory,
    selectedHistoryIndex,
}: ImageDisplayProps) {
    /** 画像保存ハンドラ */
    const handleDownload = () => {
        if (!currentImage) return;
        downloadImage(currentImage.base64, currentImage.mimeType);
    };

    return (
        <div className="image-display-panel glass-panel">
            <h2>🖼️ 生成結果</h2>

            {/* ローディング中 */}
            {isLoading && (
                <div className="image-skeleton">
                    <span className="skeleton-text">✨ 画像を生成中...</span>
                </div>
            )}

            {/* エラー表示 */}
            {error && !isLoading && (
                <div className="error-display">
                    <div className="error-title">⚠️ エラーが発生しました</div>
                    <div className="error-message">{error.message}</div>
                    {error.details && (
                        <div className="error-details">{error.details}</div>
                    )}
                </div>
            )}

            {/* 画像表示 */}
            {currentImage && !isLoading && (
                <div className="image-result">
                    <div className="image-wrapper">
                        <img
                            src={`data:${currentImage.mimeType};base64,${currentImage.base64}`}
                            alt="生成された画像"
                        />
                    </div>
                    <div className="image-actions">
                        <button className="action-btn primary" onClick={handleDownload}>
                            💾 保存
                        </button>
                    </div>
                </div>
            )}

            {/* 空の状態 */}
            {!currentImage && !isLoading && !error && (
                <div className="image-empty">
                    <span className="image-empty-icon">🎨</span>
                    <span className="image-empty-text">
                        プロンプトを入力して<br />画像を生成してください
                    </span>
                </div>
            )}

            {/* 履歴 */}
            {history.length > 0 && (
                <div className="image-history">
                    <span className="history-label">生成履歴</span>
                    <div className="history-grid">
                        {history.map((item, index) => (
                            <div
                                key={item.timestamp}
                                className={`history-thumb ${index === selectedHistoryIndex ? 'active' : ''}`}
                                onClick={() => onSelectHistory(index)}
                                title={item.prompt.substring(0, 50)}
                            >
                                <img
                                    src={`data:${item.image.mimeType};base64,${item.image.base64}`}
                                    alt={`履歴 ${index + 1}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
