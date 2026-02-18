import { useState, useCallback } from 'react';
import SettingsPanel from './components/SettingsPanel';
import PromptInput from './components/PromptInput';
import ImageDisplay from './components/ImageDisplay';
import CostDisplay from './components/CostDisplay';
import {
    generateImage,
    calculateCost,
    ApiError,
    type AspectRatio,
    type Resolution,
    type GeneratedImage,
} from './services/api';
import './App.css';

/** 参照画像の型 */
interface ReferenceImage {
    base64: string;
    mimeType: string;
    name: string;
    size: number;
}

/** 生成履歴アイテム */
interface HistoryItem {
    image: GeneratedImage;
    prompt: string;
    timestamp: number;
}

/**
 * メインアプリケーションコンポーネント
 * 全ての状態管理とAPI呼び出しのオーケストレーションを行う
 */
export default function App() {
    /* 設定 */
    const [apiKey, setApiKey] = useState(
        () => localStorage.getItem('nbp_api_key') || '',
    );
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [resolution, setResolution] = useState<Resolution>('1K');

    /* プロンプト & 参照画像 */
    const [prompt, setPrompt] = useState('');
    const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(
        null,
    );

    /* 生成結果 */
    const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<{
        message: string;
        details?: string;
    } | null>(null);

    /* 履歴 */
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(-1);

    /* コスト */
    const [lastCost, setLastCost] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [generationCount, setGenerationCount] = useState(0);

    /** 生成ボタンが押せるか */
    const canGenerate = apiKey.trim().length > 0 && prompt.trim().length > 0;

    /** 画像生成の実行 */
    const handleGenerate = useCallback(async () => {
        if (!canGenerate || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await generateImage({
                apiKey,
                prompt,
                aspectRatio,
                resolution,
                referenceImage: referenceImage
                    ? { base64: referenceImage.base64, mimeType: referenceImage.mimeType }
                    : undefined,
            });

            setCurrentImage(result);
            setSelectedHistoryIndex(-1);

            /* 履歴に追加（最大20件） */
            setHistory((prev) => {
                const newHistory = [
                    { image: result, prompt, timestamp: Date.now() },
                    ...prev,
                ];
                return newHistory.slice(0, 20);
            });

            /* コスト計算 */
            const cost = calculateCost(resolution, !!referenceImage);
            setLastCost(cost);
            setTotalCost((prev) => prev + cost);
            setGenerationCount((prev) => prev + 1);
        } catch (err) {
            if (err instanceof ApiError) {
                setError({ message: err.message, details: err.details });
            } else {
                setError({ message: '予期しないエラーが発生しました。' });
            }
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, prompt, aspectRatio, resolution, referenceImage, canGenerate, isLoading]);

    /** 履歴から選択 */
    const handleSelectHistory = (index: number) => {
        const item = history[index];
        if (item) {
            setCurrentImage(item.image);
            setSelectedHistoryIndex(index);
        }
    };

    return (
        <div className="app">
            {/* ヘッダー */}
            <header className="app-header">
                <div className="app-logo">
                    <span className="app-logo-icon">🍌</span>
                    <div>
                        <h1>NBP Image Generator</h1>
                        <span className="app-logo-sub">
                            Powered by gemini-3-pro-image
                        </span>
                    </div>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="app-main">
                {/* サイドバー */}
                <aside className="sidebar">
                    <SettingsPanel
                        apiKey={apiKey}
                        onApiKeyChange={setApiKey}
                        aspectRatio={aspectRatio}
                        onAspectRatioChange={setAspectRatio}
                        resolution={resolution}
                        onResolutionChange={setResolution}
                    />
                </aside>

                {/* メインエリア */}
                <div className="main-content">
                    <PromptInput
                        prompt={prompt}
                        onPromptChange={setPrompt}
                        referenceImage={referenceImage}
                        onReferenceImageChange={setReferenceImage}
                        onGenerate={handleGenerate}
                        isLoading={isLoading}
                        canGenerate={canGenerate}
                    />
                    <ImageDisplay
                        currentImage={currentImage}
                        isLoading={isLoading}
                        error={error}
                        history={history}
                        onSelectHistory={handleSelectHistory}
                        selectedHistoryIndex={selectedHistoryIndex}
                    />
                </div>
            </main>

            {/* フッター: コスト表示 */}
            <footer className="app-footer">
                <CostDisplay
                    lastCost={lastCost}
                    totalCost={totalCost}
                    generationCount={generationCount}
                />
            </footer>
        </div>
    );
}
