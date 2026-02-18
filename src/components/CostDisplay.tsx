import { USD_TO_JPY } from '../services/api';
import './CostDisplay.css';

interface CostDisplayProps {
    /** 今回の生成コスト (USD) */
    lastCost: number;
    /** セッション累計コスト (USD) */
    totalCost: number;
    /** 生成回数 */
    generationCount: number;
}

/**
 * コスト概算表示コンポーネント
 * 単価・累計をUSD/JPY両方で表示
 */
export default function CostDisplay({
    lastCost,
    totalCost,
    generationCount,
}: CostDisplayProps) {
    const formatUsd = (v: number) => `$${v.toFixed(3)}`;
    const formatJpy = (v: number) => `¥${Math.round(v * USD_TO_JPY).toLocaleString()}`;

    return (
        <div className="cost-display glass-panel">
            <div className="cost-item">
                <span className="cost-label">今回のコスト</span>
                <span className="cost-value">
                    <span className="usd">{formatUsd(lastCost)}</span>
                    <span className="jpy">({formatJpy(lastCost)})</span>
                </span>
            </div>

            <div className="cost-divider" />

            <div className="cost-item total">
                <span className="cost-label">セッション累計</span>
                <span className="cost-value">
                    <span className="usd">{formatUsd(totalCost)}</span>
                    <span className="jpy">({formatJpy(totalCost)})</span>
                    <span className="cost-count"> / {generationCount}回</span>
                </span>
            </div>
        </div>
    );
}
