/**
 * Gemini 3 Pro Image API通信サービス
 *
 * generateContent エンドポイントを使用し、画像生成リクエストを行う。
 * 参照画像はBase64 inlineDataとして送信する。
 */

/** サポートされるアスペクト比一覧 */
export const ASPECT_RATIOS = [
    '1:1',
    '3:2',
    '2:3',
    '3:4',
    '4:3',
    '4:5',
    '5:4',
    '9:16',
    '16:9',
    '21:9',
] as const;

export type AspectRatio = (typeof ASPECT_RATIOS)[number];

/** サポートされる解像度 */
export const RESOLUTIONS = ['1K', '2K', '4K'] as const;
export type Resolution = (typeof RESOLUTIONS)[number];

/** コスト単価テーブル (USD/枚) */
export const COST_TABLE: Record<Resolution, number> = {
    '1K': 0.134,
    '2K': 0.134,
    '4K': 0.24,
};

/** 参照画像入力コスト (USD/枚) */
export const REFERENCE_IMAGE_COST = 0.001;

/** USD→JPY 概算為替レート */
export const USD_TO_JPY = 150;

/** API レスポンスから抽出した画像データ */
export interface GeneratedImage {
    /** Base64エンコード済み画像データ */
    base64: string;
    /** MIMEタイプ */
    mimeType: string;
}

/** 画像生成リクエストパラメータ */
export interface GenerateImageParams {
    apiKey: string;
    prompt: string;
    aspectRatio: AspectRatio;
    resolution: Resolution;
    /** 参照画像（Base64）。未指定でもOK */
    referenceImage?: {
        base64: string;
        mimeType: string;
    };
}

/** API エラー */
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public details?: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Gemini 3 Pro Image で画像生成する
 */
export async function generateImage(
    params: GenerateImageParams,
): Promise<GeneratedImage> {
    const { apiKey, prompt, aspectRatio, resolution, referenceImage } = params;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

    /* リクエストボディの parts を組み立てる */
    const parts: Array<Record<string, unknown>> = [];

    /* 参照画像がある場合は先に追加 */
    if (referenceImage) {
        parts.push({
            inlineData: {
                mimeType: referenceImage.mimeType,
                data: referenceImage.base64,
            },
        });
    }

    /* プロンプトテキスト */
    parts.push({ text: prompt });

    const requestBody = {
        contents: [
            {
                parts,
            },
        ],
        generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            imageConfig: {
                aspectRatio,
                imageSize: resolution,
            },
        },
    };

    let response: Response;
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });
    } catch (err) {
        throw new ApiError(
            'ネットワークエラー: APIに接続できませんでした。',
            undefined,
            String(err),
        );
    }

    if (!response.ok) {
        const errorBody = await response.text();
        throw new ApiError(
            `APIエラー (${response.status}): ${response.statusText}`,
            response.status,
            errorBody,
        );
    }

    const data = await response.json();

    /* レスポンス全体をデバッグ用に文字列化（エラー時に表示） */
    const responseDebug = JSON.stringify(data, null, 2);

    /* レスポンスから画像パートを探す */
    const candidates = data?.candidates;
    if (!candidates || candidates.length === 0) {
        /* promptFeedback にブロック理由が含まれる場合がある */
        const blockReason = data?.promptFeedback?.blockReason;
        const blockMsg = blockReason
            ? `ブロック理由: ${blockReason}`
            : 'レスポンスに候補が含まれていません。';
        throw new ApiError(blockMsg, response.status, responseDebug);
    }

    /* finishReason チェック */
    const finishReason = candidates[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        throw new ApiError(
            `生成が中断されました (finishReason: ${finishReason})`,
            response.status,
            responseDebug,
        );
    }

    const responseParts = candidates[0]?.content?.parts;
    if (!responseParts || responseParts.length === 0) {
        throw new ApiError(
            'レスポンスのパートが空です。',
            response.status,
            responseDebug,
        );
    }

    const imagePart = responseParts.find(
        (part: Record<string, unknown>) => part.inlineData,
    );

    if (!imagePart?.inlineData) {
        /* テキストのみの応答ならテキスト内容 + レスポンス全体を表示 */
        const textPart = responseParts.find(
            (part: Record<string, unknown>) => part.text,
        );
        const textContent = textPart?.text as string;
        throw new ApiError(
            '画像が生成されませんでした。',
            response.status,
            textContent
                ? `テキスト応答: ${textContent}\n\n--- レスポンス全体 ---\n${responseDebug}`
                : responseDebug,
        );
    }

    return {
        base64: imagePart.inlineData.data as string,
        mimeType: (imagePart.inlineData.mimeType as string) || 'image/png',
    };
}

/**
 * コスト計算 (USD)
 */
export function calculateCost(
    resolution: Resolution,
    hasReferenceImage: boolean,
): number {
    let cost = COST_TABLE[resolution];
    if (hasReferenceImage) {
        cost += REFERENCE_IMAGE_COST;
    }
    return cost;
}

/**
 * Base64データURLから画像をダウンロード保存する
 */
export function downloadImage(
    base64: string,
    mimeType: string,
    filename?: string,
): void {
    const ext = mimeType.split('/')[1] || 'png';
    const name = filename || `generated_${Date.now()}.${ext}`;
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64}`;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
