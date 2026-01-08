import { GoogleGenAI, Type } from "@google/genai";
import { ActivitySuggestion, RewardSuggestion } from "../types";

// Initialize Gemini client
// Note: In a real production app, this should be proxied through a backend to hide the key.
// Here we assume process.env.API_KEY is available as per instructions.

export const suggestActivities = async (kidNames: string[]): Promise<ActivitySuggestion[]> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided for Gemini");
    return [
      { title: "Đọc sách cùng mẹ", icon: "📚", reason: "Phát triển tư duy ngôn ngữ" },
      { title: "Tưới cây", icon: "🌱", reason: "Yêu thiên nhiên" },
      { title: "Dọn đồ chơi", icon: "🧸", reason: "Rèn luyện tính gọn gàng" }
    ];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gợi ý 5 hoạt động hàng ngày thú vị, bổ ích cho trẻ em tên là ${kidNames.join(" và ")}. Các hoạt động nên đơn giản, dễ thực hiện tại nhà và giúp trẻ phát triển thói quen tốt.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Tên hoạt động ngắn gọn" },
              icon: { type: Type.STRING, description: "Một emoji phù hợp" },
              reason: { type: Type.STRING, description: "Lý do tại sao hoạt động này tốt" }
            },
            required: ["title", "icon", "reason"]
          }
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) return [];
    return JSON.parse(jsonStr) as ActivitySuggestion[];

  } catch (error) {
    console.error("Error fetching activity suggestions:", error);
    return [];
  }
};

export const suggestRewards = async (score: number, kidName: string): Promise<RewardSuggestion[]> => {
  if (!process.env.API_KEY) return [
    { title: "Đi ăn kem", description: "Bé được chọn vị kem yêu thích", pointsCost: 100 },
    { title: "Mua đồ chơi nhỏ", description: "Món đồ chơi dưới 50k", pointsCost: 100 },
    { title: "Đi công viên", description: "Cả nhà cùng đi dạo công viên", pointsCost: 100 }
  ];

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bé ${kidName} vừa đạt được ${score} điểm rèn luyện. Hãy gợi ý 3 phần thưởng sáng tạo, phù hợp với trẻ em để khích lệ bé.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Tên phần thưởng" },
              description: { type: Type.STRING, description: "Mô tả chi tiết hấp dẫn" },
              pointsCost: { type: Type.NUMBER, description: "Số điểm cần đổi (thường là 100)" }
            },
            required: ["title", "description", "pointsCost"]
          }
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) return [];
    return JSON.parse(jsonStr) as RewardSuggestion[];
  } catch (error) {
    console.error("Error fetching reward suggestions:", error);
    return [];
  }
};
