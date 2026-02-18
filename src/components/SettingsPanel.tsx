import { useState, useEffect } from 'react';
import {
    ASPECT_RATIOS,
    RESOLUTIONS,
    COST_TABLE,
    type AspectRatio,
    type Resolution,
} from '../services/api';
import './SettingsPanel.css';

interface SettingsPanelProps {
    apiKey: string;
    onApiKeyChange: (key: string) => void;
    aspectRatio: AspectRatio;
    onAspectRatioChange: (ratio: AspectRatio) => void;
    resolution: Resolution;
    onResolutionChange: (res: Resolution) => void;
}

/**
 * 設定パネルコンポーネント
 * API Key（localStorage永続化）、アスペクト比、解像度の設定を行う
 */
export default function SettingsPanel({
    apiKey,
    onApiKeyChange,
    aspectRatio,
    onAspectRatioChange,
    resolution,
    onResolutionChange,
}: SettingsPanelProps) {
    const [showKey, setShowKey] = useState(false);

    /* API Key を localStorage に永続化 */
    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('nbp_api_key', apiKey);
        }
    }, [apiKey]);

    return (
        <div className="settings-panel glass-panel">
            <h2>⚙️ 設定</h2>

            {/* API Key */}
            <div className="settings-group">
                <label>API Key</label>
                <div className="api-key-wrapper">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => onApiKeyChange(e.target.value)}
                        placeholder="Google API Key を入力..."
                    />
                    <button
                        className="api-key-toggle"
                        onClick={() => setShowKey(!showKey)}
                        title={showKey ? '非表示' : '表示'}
                    >
                        {showKey ? '🙈' : '👁️'}
                    </button>
                </div>
                <span className={`api-key-status ${apiKey ? '' : 'not-set'}`}>
                    {apiKey ? '✓ 設定済み' : '未設定'}
                </span>
            </div>

            {/* アスペクト比 */}
            <div className="settings-group">
                <label>アスペクト比</label>
                <div className="aspect-ratio-grid">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio}
                            className={`aspect-ratio-btn ${aspectRatio === ratio ? 'active' : ''}`}
                            onClick={() => onAspectRatioChange(ratio)}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
            </div>

            {/* 解像度 */}
            <div className="settings-group">
                <label>解像度</label>
                <div className="resolution-group">
                    {RESOLUTIONS.map((res) => (
                        <button
                            key={res}
                            className={`resolution-btn ${resolution === res ? 'active' : ''}`}
                            onClick={() => onResolutionChange(res)}
                        >
                            {res}
                            <span className="resolution-price">
                                ${COST_TABLE[res].toFixed(3)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
