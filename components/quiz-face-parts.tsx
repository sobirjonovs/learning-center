"use client";

import { useId } from "react";
import type { MouthStyle, QuizFaceId } from "@/lib/quiz-avatars";

/** Umumiy ko'z + qosh (barcha rasmiy SVG larda bir xil) */
function FaceEyesBrows() {
  return (
    <>
      <path
        d="M444.32 449.722C444.32 405.894 479.85 370.364 523.678 370.364C567.506 370.364 603.034 405.894 603.034 449.722C603.034 493.55 567.506 529.08 523.678 529.08C479.85 529.08 444.32 493.55 444.32 449.722Z"
        fill="black"
      />
      <path
        d="M448.576 455.398C448.576 417.073 479.644 386.005 517.969 386.005C556.294 386.005 587.363 417.073 587.363 455.398C587.363 493.723 556.294 524.791 517.969 524.791C479.644 524.791 448.576 493.723 448.576 455.398Z"
        fill="white"
      />
      <path
        d="M473.287 455.398C473.287 437.017 488.188 422.116 506.569 422.116C524.949 422.116 539.849 437.017 539.849 455.398C539.849 473.779 524.949 488.68 506.569 488.68C488.188 488.68 473.287 473.779 473.287 455.398Z"
        fill="black"
      />
      <path
        d="M355.682 449.722C355.682 405.894 320.152 370.364 276.324 370.364C232.496 370.364 196.967 405.894 196.967 449.722C196.967 493.55 232.496 529.08 276.324 529.08C320.152 529.08 355.682 493.55 355.682 449.722Z"
        fill="black"
      />
      <path
        d="M351.426 455.398C351.426 417.073 320.358 386.005 282.033 386.005C243.708 386.005 212.639 417.073 212.639 455.398C212.639 493.723 243.708 524.791 282.033 524.791C320.358 524.791 351.426 493.723 351.426 455.398Z"
        fill="white"
      />
      <path
        d="M326.714 455.398C326.714 437.017 311.813 422.116 293.432 422.116C275.052 422.116 260.152 437.017 260.152 455.398C260.152 473.779 275.052 488.68 293.432 488.68C311.813 488.68 326.714 473.779 326.714 455.398Z"
        fill="black"
      />
      <path
        d="M466.457 305.604L470.654 336.062C516.968 314.765 563.946 340.997 563.946 340.997L573.068 315.536C520.609 281.181 466.457 305.604 466.457 305.604Z"
        fill="black"
      />
      <path
        d="M231.189 315.536L240.312 340.997C240.312 340.997 287.289 314.765 333.603 336.062L337.8 305.604C337.8 305.604 283.648 281.18 231.189 315.536Z"
        fill="black"
      />
    </>
  );
}

const MOUTH_BLACK =
  "M291.207 625.483C291.207 625.483 396.018 660.256 508.683 623.876C508.683 623.876 495.376 708.641 402.434 709.129C299.288 709.618 291.207 625.483 291.207 625.483Z";

/** Pastki iyak (oq) va til (qizil) — bir xil shakl */
const JAW_SHAPE =
  "M401.002 682.585C452.335 682.585 494.013 700.633 494.013 722.862C494.013 745.092 452.335 763.14 401.002 763.14C349.669 763.14 307.99 745.092 307.99 722.862C307.99 700.633 349.669 682.585 401.002 682.585Z";

const TONGUE_COLOR = "#E85555";

/** Pastki iyak ellipsi — happy da til bilan, satisfied/sad da faqat oq */
function FaceJawOverlay({
  noJaw,
  jawOpacity,
  withTongue,
}: {
  noJaw: boolean;
  jawOpacity: number;
  withTongue: boolean;
}) {
  if (noJaw) return null;
  return (
    <g opacity={jawOpacity}>
      <path d={JAW_SHAPE} fill="white" />
      {withTongue && <path d={JAW_SHAPE} fill={TONGUE_COLOR} />}
    </g>
  );
}

/** Og'iz qismi — tana kategoriyasiga qarab rasmiy SVG */
function FaceMouth({
  mouthStyle,
  mask1Id,
  noJaw,
  jawOpacity,
  pureFace,
}: {
  mouthStyle: MouthStyle;
  mask1Id: string;
  noJaw: boolean;
  jawOpacity: number;
  pureFace: boolean;
}) {
  if (mouthStyle === "none") return null;

  return (
    <g mask={`url(#${mask1Id})`}>
      <path d={MOUTH_BLACK} fill="black" />
      <FaceJawOverlay noJaw={noJaw} jawOpacity={jawOpacity} withTongue />

      {/* Faqat yuz — to'liq happy-face tishlari */}
      {pureFace && (
        <>
          <path
            d="M400 630.193H362.523L372.104 666.205C372.763 668.683 374.72 670.596 377.213 671.193C382.199 672.387 391.091 673.461 400 673.461C408.909 673.461 417.801 672.387 422.787 671.193C425.28 670.596 427.237 668.683 427.896 666.205L437.477 630.193H400Z"
            fill="white"
          />
          <path
            d="M316.752 615.031C316.752 615.031 321.106 638.626 324.09 645.784C325.28 648.639 348.863 665.637 400.52 665.637C430.653 665.637 451.473 660.197 451.473 660.197L458.727 644.307V658.124C458.727 658.124 471.603 653.315 476.908 649.132C479.704 646.927 484.288 615.031 484.288 615.031H316.752Z"
            fill="white"
          />
        </>
      )}

      {/* kemiruvchi: 2 old tish (rasmiy SVG 2) */}
      {!pureFace && mouthStyle === "rodent" && (
        <path
          d="M400 639.039H362.523L372.104 675.051C372.763 677.529 374.72 679.442 377.213 680.039C382.199 681.233 391.091 682.307 400 682.307C408.909 682.307 417.801 681.233 422.787 680.039C425.28 679.442 427.237 677.529 427.896 675.051L437.477 639.039H400Z"
          fill="white"
        />
      )}

      {/* bo'ri tish: ikki yonda uchbur tish (rasmiy SVG 4) */}
      {!pureFace && mouthStyle === "fang" && (
        <>
          <path
            d="M459.645 631.27C459.645 631.27 457.443 644.916 449.035 652.887C447.248 654.581 444.295 653.305 444.301 650.843L444.344 631.27H459.645Z"
            fill="white"
          />
          <path
            d="M340.355 631.27C340.355 631.27 342.557 644.916 350.965 652.887C352.752 654.581 355.705 653.305 355.699 650.843L355.656 631.27H340.355Z"
            fill="white"
          />
        </>
      )}

      {/* to'liq tishli (rasmiy SVG 5) */}
      {!pureFace && mouthStyle === "full-teeth" && (
        <path
          d="M316 620C316 620 320.354 643.595 323.338 650.753C324.528 653.608 348.111 670.606 399.768 670.606C429.901 670.606 450.721 665.166 450.721 665.166L457.975 649.276V663.093C457.975 663.093 470.851 658.284 476.156 654.101C478.952 651.896 483.536 620 483.536 620H316Z"
          fill="white"
        />
      )}
    </g>
  );
}

/** Happy-face — rasmiy SVG lar asosida */
function HappyFaceLayer({
  mouthStyle,
  noJaw,
  jawOpacity,
  pureFace,
}: {
  mouthStyle: MouthStyle;
  noJaw: boolean;
  jawOpacity: number;
  pureFace: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const clipId = `hf_clip_${uid}`;
  const mask0Id = `hf_m0_${uid}`;
  const mask1Id = `hf_m1_${uid}`;

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect width="800" height="800" fill="white" />
        </clipPath>
        <mask
          id={mask0Id}
          style={{ maskType: "luminance" }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="800"
          height="800"
        >
          <path d="M800 0H0V800H800V0Z" fill="white" />
        </mask>
        <mask
          id={mask1Id}
          style={{ maskType: "luminance" }}
          maskUnits="userSpaceOnUse"
          x="291"
          y="624"
          width="219"
          height="86"
        >
          <path
            d="M291.707 625.983C291.707 625.983 396.518 660.756 509.183 624.376C509.183 624.376 495.876 709.141 402.934 709.629C299.788 710.118 291.707 625.983 291.707 625.983Z"
            fill="white"
          />
        </mask>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <g mask={`url(#${mask0Id})`}>
          <FaceMouth
            mouthStyle={mouthStyle}
            mask1Id={mask1Id}
            noJaw={noJaw}
            jawOpacity={jawOpacity}
            pureFace={pureFace}
          />
          <FaceEyesBrows />
        </g>
      </g>
    </>
  );
}

/** Rasmiy sad-face SVG */
function SadFaceLayer({
  hideMouth,
  noJaw,
  jawOpacity,
}: {
  hideMouth: boolean;
  noJaw: boolean;
  jawOpacity: number;
}) {
  const uid = useId().replace(/:/g, "");
  const clipId = `sf_clip_${uid}`;
  const mask0Id = `sf_m0_${uid}`;
  const mask1Id = `sf_m1_${uid}`;
  const mask2Id = `sf_m2_${uid}`;

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect width="800" height="800" fill="white" />
        </clipPath>
        <mask id={mask0Id} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="800">
          <path d="M800 0H0V800H800V0Z" fill="white" />
        </mask>
        <mask id={mask1Id} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="800">
          <path d="M0 0H800V800H0V0ZM560.821 251.111C447.62 251.111 355.852 296.119 355.852 351.639C355.852 407.159 447.62 452.167 560.821 452.167C674.022 452.167 765.789 407.159 765.789 351.639C765.789 296.119 674.022 251.111 560.821 251.111Z" fill="white" />
        </mask>
        <mask id={mask2Id} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="800">
          <path d="M0 0H800V800H0V0ZM236.806 251.111C123.605 251.111 31.8372 296.119 31.8372 351.639C31.8372 407.159 123.605 452.167 236.806 452.167C350.007 452.167 441.775 407.159 441.775 351.639C441.775 296.119 350.007 251.111 236.806 251.111Z" fill="white" />
        </mask>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <g mask={`url(#${mask0Id})`}>
          {!hideMouth && (
            <>
              <path d="M317.97 669.193C317.269 669.487 316.77 668.341 317.355 667.78C324.389 661.034 346.899 644.705 400.001 644.705C453.102 644.705 475.612 661.034 482.646 667.78C483.231 668.341 482.732 669.487 482.031 669.193C472.853 665.343 444.371 655.152 400.001 655.152C355.63 655.152 327.148 665.343 317.97 669.193Z" fill="black" />
              <FaceJawOverlay noJaw={noJaw} jawOpacity={jawOpacity} withTongue={false} />
              {!noJaw && (
                <path
                  d="M400 691.019C366.577 691.019 344.455 681.351 344.455 681.351C362.41 713.063 395.392 712.316 400 712.316C404.608 712.316 437.59 713.063 455.545 681.351C455.545 681.351 433.423 691.019 400 691.019Z"
                  fill="black"
                  opacity={jawOpacity}
                />
              )}
            </>
          )}
          <g mask={`url(#${mask1Id})`}>
            <path d="M448.574 461.358C448.574 423.033 479.642 391.965 517.967 391.965C556.292 391.965 587.361 423.033 587.361 461.358C587.361 499.683 556.292 530.751 517.967 530.751C479.642 530.751 448.574 499.683 448.574 461.358Z" fill="white" />
            <path d="M485.695 454.549C485.695 436.168 500.596 421.267 518.977 421.267C537.357 421.267 552.257 436.168 552.257 454.549C552.257 472.93 537.357 487.831 518.977 487.831C500.596 487.831 485.695 472.93 485.695 454.549Z" fill="black" />
          </g>
          <g mask={`url(#${mask2Id})`}>
            <path d="M351.424 461.358C351.424 423.033 320.356 391.965 282.031 391.965C243.706 391.965 212.637 423.033 212.637 461.358C212.637 499.683 243.706 530.751 282.031 530.751C320.356 530.751 351.424 499.683 351.424 461.358Z" fill="white" />
            <path d="M312.259 454.549C312.259 436.168 297.358 421.267 278.977 421.267C260.597 421.267 245.697 436.168 245.697 454.549C245.697 472.93 260.597 487.831 278.977 487.831C297.358 487.831 312.259 472.93 312.259 454.549Z" fill="black" />
          </g>
          <path d="M568.244 371.916C519.506 386.155 477.038 353.464 477.038 353.464L464.341 377.223C511.027 418.717 567.943 402.539 567.943 402.539L568.244 371.916Z" fill="black" />
          <path d="M329.508 353.202C329.508 353.202 286.649 385.378 238.086 370.552L238.017 401.176C238.017 401.176 294.734 418.04 341.918 377.113L329.508 353.202Z" fill="black" />
        </g>
      </g>
    </>
  );
}

/** Rasmiy satisfied-face SVG */
function SatisfiedFaceLayer({
  hideMouth,
  noJaw,
  jawOpacity,
}: {
  hideMouth: boolean;
  noJaw: boolean;
  jawOpacity: number;
}) {
  return (
    <g>
      <path d="M523.68 535.04C567.51 535.04 603.04 499.51 603.04 455.68C603.04 411.851 567.51 376.32 523.68 376.32C479.851 376.32 444.32 411.851 444.32 455.68C444.32 499.51 479.851 535.04 523.68 535.04Z" fill="black" />
      <path d="M517.97 530.75C556.293 530.75 587.36 499.683 587.36 461.36C587.36 423.037 556.293 391.97 517.97 391.97C479.647 391.97 448.58 423.037 448.58 461.36C448.58 499.683 479.647 530.75 517.97 530.75Z" fill="white" />
      <path d="M506.569 494.64C524.949 494.64 539.849 479.74 539.849 461.36C539.849 442.98 524.949 428.08 506.569 428.08C488.189 428.08 473.289 442.98 473.289 461.36C473.289 479.74 488.189 494.64 506.569 494.64Z" fill="black" />
      <path d="M466.461 321.12L470.651 351.58C516.971 330.28 563.951 356.51 563.951 356.51L573.071 331.05C520.611 296.7 466.461 321.12 466.461 321.12Z" fill="black" />
      <path d="M231.189 331.05L240.309 356.51C240.309 356.51 287.309 330.28 333.599 351.58L337.799 321.12C337.799 321.12 283.649 296.7 231.189 331.05Z" fill="black" />
      <path d="M276.321 535.04C320.15 535.04 355.681 499.51 355.681 455.68C355.681 411.851 320.15 376.32 276.321 376.32C232.492 376.32 196.961 411.851 196.961 455.68C196.961 499.51 232.492 535.04 276.321 535.04Z" fill="black" />
      <path d="M282.031 530.75C320.354 530.75 351.421 499.683 351.421 461.36C351.421 423.037 320.354 391.97 282.031 391.97C243.708 391.97 212.641 423.037 212.641 461.36C212.641 499.683 243.708 530.75 282.031 530.75Z" fill="white" />
      <path d="M293.43 494.64C311.81 494.64 326.71 479.74 326.71 461.36C326.71 442.98 311.81 428.08 293.43 428.08C275.05 428.08 260.15 442.98 260.15 461.36C260.15 479.74 275.05 494.64 293.43 494.64Z" fill="black" />
      {!hideMouth && (
        <>
          <path d="M482.001 652.73C482.701 652.44 483.201 653.58 482.621 654.14C475.621 660.89 453.071 677.22 399.971 677.22C346.871 677.22 324.361 660.89 317.321 654.14C316.741 653.58 317.241 652.44 317.941 652.73C327.121 656.58 355.601 666.73 399.941 666.73C444.281 666.73 472.851 656.58 482.001 652.73Z" fill="black" />
          <FaceJawOverlay noJaw={noJaw} jawOpacity={jawOpacity} withTongue={false} />
          {!noJaw && (
            <path
              d="M400.001 710.15C366.581 710.15 344.461 700.48 344.461 700.48C362.461 732.19 395.391 731.48 400.001 731.48C404.611 731.48 437.591 732.23 455.541 700.48C455.541 700.48 433.421 710.15 400.001 710.15Z"
              fill="black"
              opacity={jawOpacity}
            />
          )}
        </>
      )}
    </g>
  );
}

export function QuizFaceSvg({
  face,
  mouthStyle,
  noJaw,
  jawOpacity,
  pureFace,
}: {
  face: QuizFaceId;
  mouthStyle: MouthStyle;
  noJaw: boolean;
  jawOpacity: number;
  pureFace: boolean;
}) {
  const hideMouth = mouthStyle === "none";

  if (face === "happy-face") {
    return (
      <HappyFaceLayer
        mouthStyle={mouthStyle}
        noJaw={noJaw}
        jawOpacity={jawOpacity}
        pureFace={pureFace}
      />
    );
  }
  if (face === "sad-face") {
    return (
      <SadFaceLayer hideMouth={hideMouth} noJaw={noJaw} jawOpacity={jawOpacity} />
    );
  }
  return (
    <SatisfiedFaceLayer hideMouth={hideMouth} noJaw={noJaw} jawOpacity={jawOpacity} />
  );
}
