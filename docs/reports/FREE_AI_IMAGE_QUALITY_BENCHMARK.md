# Free AI Image Quality Benchmark — 24 November 2026

## Status: NOT_RUN

No configured free provider was available, so no image was generated and no provider is ranked. This avoids presenting synthetic scores, sample images, or a placeholder poster as evidence.

## Fixed benchmark protocol for the first configured provider

Use the same approved creative brief, seed where supported, output preset, and no embedded text for each candidate. Store the original response metadata and the generated asset in the test record.

| Scenario | Criteria |
|---|---|
| Người mẫu mặc áo thể thao | Natural skin, anatomy/hands, fabric drape, prompt adherence |
| Thời trang công sở | Tailoring geometry, material detail, lighting |
| Bộ sưu tập mùa đông | Layering, textile texture, color consistency |
| Luxury fashion editorial | Composition, art direction, photorealism |
| Poster sale đầu tháng 12 | Background quality only; Vietnamese text is canvas/SVG, not raster AI text |
| Homepage banner | Crop-safe composition and usable negative space |
| Ảnh studio sản phẩm | Product fidelity only when reference/image-edit capability has been verified |
| Lifestyle ngoài đường phố | Natural perspective, shadows, and scene consistency |

Record: provider/model, request time, duration, true dimensions, returned usage/cost status, verified quota if the account exposes it, and any moderation/error result. Review product fidelity separately: a text-only provider must be used only for a background with the original product layer composited afterwards.

## Current provider constraints

- Cloudflare FLUX.1 Schnell: current official documentation exposes prompt/steps and base64 output; it does not make a free quota guarantee for this deployment.
- Pollinations: current official catalog is dynamic and API key-based; model availability/pricing must be obtained from the current catalog/account at run time.
- Local ComfyUI: no installed workflow/model was tested.

No output images are attached because none were generated.
