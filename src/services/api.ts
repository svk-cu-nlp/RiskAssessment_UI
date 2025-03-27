const BASE_URL = "http://localhost:8000";

export interface FeatureExtractionResponse {
  feature_details: string;
  srs_text: string;
  project_summary: string;
}

export interface FeedbackData {
  message: string;
  comments: Array<{
    text: string;
    selected_text: string;
    start_index: number;
    end_index: number;
  }>;
  rejections: Array<{
    selected_text: string;
    start_index: number;
    end_index: number;
  }>;
}

export interface RiskAnalysisResponse {
  risk_analysis: string;
}

export async function extractFeatures(file: File): Promise<FeatureExtractionResponse> {
  try {
    // First convert file to base64
    const base64Content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Generate summary
    const summaryResponse = await fetch(`${BASE_URL}/summary/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: base64Content,
        project_name: file.name.replace('.pdf', '')
      }),
    });

    if (!summaryResponse.ok) {
      throw new Error(`Summary API Error: ${summaryResponse.statusText}`);
    }

    const summaryResult = await summaryResponse.json();

    // Extract features
    const featuresResponse = await fetch(`${BASE_URL}/features/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        srs_content: summaryResult.srs_text,
        project_summary: summaryResult.project_summary
      }),
    });

    if (!featuresResponse.ok) {
      throw new Error(`Features API Error: ${featuresResponse.statusText}`);
    }

    const featuresResult = await featuresResponse.json();

    return {
      feature_details: featuresResult.feature_details,
      srs_text: summaryResult.srs_text,
      project_summary: summaryResult.project_summary
    };
  } catch (error) {
    console.error('Error extracting features:', error);
    throw error;
  }
}

export async function submitFeatureFeedback(
  features: string,
  feedback: FeedbackData,
  srsContent: string,
  projectSummary: string
): Promise<{ feature_details: string }> {
  try {
    const response = await fetch(`${BASE_URL}/features/re-evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        srs_content: srsContent,
        project_summary: projectSummary,
        previous_features: features,
        user_feedback: feedback
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
}

export async function analyzeRisks(
  features: string,
  srsContent: string,
  projectSummary: string
): Promise<RiskAnalysisResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/risks/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        features: features,
        srs_content: srsContent,
        project_summary: projectSummary
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing risks:', error);
    throw error;
  }
}

export async function submitRiskFeedback(
  riskReport: string,
  feedback: {
    comments: Array<{
      text: string;
      selected_text: string;
      start_index: number;
      end_index: number;
    }>;
    rejections: Array<{
      selected_text: string;
      start_index: number;
      end_index: number;
    }>;
  }
): Promise<{ message: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/risks/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        risk_report: riskReport,
        feedback: feedback
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting risk feedback:', error);
    throw error;
  }
}




