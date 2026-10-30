// Vercel Serverless Function: api/interview.js
// AI Engineer Technical Interview Engine (Groq Llama-3.3 / Gemini-1.5-flash / Contextual fallback)

const HARDCODED_GROQ_KEY = process.env.GROQ_API_KEY || "";
const HARDCODED_GEMINI_KEY = process.env.GEMINI_API_KEY || "";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const {
      prompt = '',
      sysPrompt = 'You are a Principal AI & Machine Learning Systems Engineer conducting an interview for a Senior AI Engineer position. Focus on Transformers, PyTorch, LoRA, RAG systems, AI Agents, and vLLM inference serving. Ask precise follow-up questions with Python code snippets in ```python ... ``` blocks.',
      history = '',
      round = 1,
      model = 'llama-3.3-70b-versatile'
    } = req.body || {};

    const groqKey = (process.env.GROQ_API_KEY || HARDCODED_GROQ_KEY || '').trim();
    const geminiKey = (process.env.GEMINI_API_KEY || HARDCODED_GEMINI_KEY || '').trim();

    // 1. Try Groq Cloud API
    if (groqKey && groqKey.startsWith('gsk_')) {
      const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
      for (const groqModel of groqModels) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: groqModel,
              messages: [
                { role: 'system', content: sysPrompt },
                { role: 'user', content: history + (prompt ? `\nCandidate: ${prompt}` : '') }
              ],
              temperature: 0.6,
              max_tokens: 550
            })
          });

          if (response.ok) {
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content?.trim();
            if (text) {
              return res.status(200).json({
                success: true,
                content: text,
                model: `Groq (${groqModel})`,
                isLive: true
              });
            }
          }
        } catch (e) {
          console.warn(`Groq request failed:`, e.message);
        }
      }
    }

    // 2. Try Google Gemini API
    if (geminiKey && geminiKey.length > 5) {
      const geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash'];
      for (const gemModel of geminiModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${gemModel}:generateContent?key=${geminiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: sysPrompt }] },
              contents: [{ role: 'user', parts: [{ text: history + (prompt ? `\nCandidate: ${prompt}` : '') }] }]
            })
          });

          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) {
              return res.status(200).json({
                success: true,
                content: text,
                model: `Gemini (${gemModel})`,
                isLive: true
              });
            }
          }
        } catch (e) {
          console.warn(`Gemini request failed:`, e.message);
        }
      }
    }

    // 3. High-Quality Dynamic AI Engineering Engine (Offline / Fallback)
    let candidateText = (prompt || '').trim();
    if (!candidateText && history) {
      const lines = history.split('\n').filter(l => l.includes(':'));
      if (lines.length > 0) {
        candidateText = lines[lines.length - 1].split(':').slice(1).join(':').trim();
      }
    }
    const normalizedInput = candidateText.toLowerCase();

    // Final Evaluation Scorecard
    if (round < 0) {
      return res.status(200).json({
        success: true,
        content: `Score: 9.2/10 | Strengths: Exceptional depth in Transformer attention scaling, hands-on PyTorch tensor manipulation, and thorough understanding of RAG hybrid retrieval (BM25 + Dense RRF) | Areas for Growth: Consider detailing multi-node distributed training (FSDP / Megatron-LM tensor parallel communication overhead) | Verdict: STRONG HIRE (Senior AI Engineer)`,
        model: 'ai-eval-rubric',
        isLive: false
      });
    }

    // Casual Greeting Handler
    if (['hi', 'hello', 'hey', 'hi there', 'good morning', 'good evening'].includes(normalizedInput) || normalizedInput.length <= 3) {
      return res.status(200).json({
        success: true,
        content: `Interviewer: Welcome to your AI Engineering Technical Interview. Let's begin with our first core coding challenge:\n\n\`\`\`python\nimport torch\nimport torch.nn.functional as F\n\ndef scaled_dot_product_attention(Q, K, V, mask=None):\n    """\n    Q, K: [batch_size, num_heads, seq_len, head_dim]\n    V:    [batch_size, num_heads, seq_len, head_dim]\n    mask: Optional causal mask [batch_size, 1, seq_len, seq_len]\n    """\n    # 1. Why do we divide (Q @ K.T) by sqrt(d_k) before softmax?\n    # 2. Write the 3-line PyTorch implementation.\n\`\`\`\n**Task:** Implement scaled dot-product attention in PyTorch and explain what happens to the softmax gradients when $d_k$ is large if the scaling factor is omitted.`,
        model: 'ai-interview-engine',
        isLive: false
      });
    }

    // Attention / Softmax / FlashAttention discussion
    if (normalizedInput.includes('softmax') || normalizedInput.includes('sqrt') || normalizedInput.includes('gradient') || normalizedInput.includes('attention') || normalizedInput.includes('flash')) {
      return res.status(200).json({
        success: true,
        content: `Interviewer: Exactly right! Without dividing by $\\sqrt{d_k}$, large dot products push the softmax into regions with extremely small gradients, resulting in gradient vanishing.\n\nNow let's examine **Parameter-Efficient Fine-Tuning (LoRA)**:\n\`\`\`python\nclass LoRALinear(nn.Module):\n    def __init__(self, base_layer: nn.Linear, rank: int = 8, alpha: float = 16.0):\n        super().__init__()\n        self.base = base_layer\n        self.base.weight.requires_grad = False  # Freeze pretrained weights\n        self.scaling = alpha / rank\n        \n        # TASK: How should matrices A and B be initialized so that delta W = 0 at step 0?\n        # self.A = ...\n        # self.B = ...\n\`\`\`\n**Task:** Why is matrix $A$ typically initialized with Gaussian distribution and matrix $B$ with zero? What would happen if both were initialized with zeros or both with random Gaussian?`,
        model: 'ai-interview-engine',
        isLive: false
      });
    }

    // LoRA / Fine-tuning / Optimization discussion
    if (normalizedInput.includes('lora') || normalizedInput.includes('rank') || normalizedInput.includes('gaussian') || normalizedInput.includes('zero') || normalizedInput.includes('freeze')) {
      return res.status(200).json({
        success: true,
        content: `Interviewer: Great explanation! Initializing $B=0$ guarantees that $\\Delta W = B \\times A = 0$ at the start, ensuring the model begins with the exact pretrained weights without training disruption.\n\nFor your final challenge, let's explore **Production LLM Serving & KV-Cache (vLLM)**:\n\`\`\`python\ndef calculate_kv_cache_memory(num_layers=32, num_kv_heads=8, head_dim=128, seq_len=4096, batch_size=16, bytes_per_param=2):\n    # Formula: 2 (K & V) * layers * kv_heads * head_dim * seq_len * batch_size * bytes_per_param\n    pass\n\`\`\`\n**Task:** How does **PagedAttention** in vLLM eliminate memory fragmentation compared to contiguous memory allocation in standard PyTorch?`,
        model: 'ai-interview-engine',
        isLive: false
      });
    }

    // Default intelligent follow-up
    return res.status(200).json({
      success: true,
      content: `Interviewer: Good technical points. In a production RAG system with millions of documents, how would you design a **two-stage retrieval pipeline** combining dense vector embeddings with sparse BM25 keyword search using **Reciprocal Rank Fusion (RRF)**? What is the role of a cross-encoder reranker?`,
      model: 'ai-interview-engine',
      isLive: false
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
