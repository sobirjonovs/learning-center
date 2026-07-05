import { cn } from "@/lib/utils";
import {
  DEFAULT_QUIZ_FACE,
  getJawOpacity,
  getMouthStyle,
  hasNoLowerJaw,
  parseQuizAvatar,
  type QuizFaceId,
} from "@/lib/quiz-avatars";
import { SVG_ICONS, type SvgIconComponent } from "@/components/svg-icons";
import { QuizFaceSvg } from "@/components/quiz-face-parts";

const sizes = {
  xs: "h-5 w-5",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-14 w-14",
  "2xl": "h-20 w-20",
  "3xl": "h-32 w-32",
} as const;

/** SVG komponentlar props qabul qilmasa ham to'g'ri o'lchamlash */
function SvgLayer({
  icon: Icon,
  className,
}: {
  icon: SvgIconComponent;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-0 block [&>svg]:block [&>svg]:h-full [&>svg]:w-full",
        className
      )}
      aria-hidden
    >
      <Icon />
    </span>
  );
}

function FaceLayer({
  id,
  expression,
  className,
}: {
  id: string;
  expression?: QuizFaceId;
  className?: string;
}) {
  const { body } = parseQuizAvatar(id);
  const face = expression ?? DEFAULT_QUIZ_FACE;
  const mouthStyle = getMouthStyle(body);
  const noJaw = hasNoLowerJaw(body);
  const jawOpacity = getJawOpacity(body);
  const pureFace = body === null;

  return (
    <svg
      viewBox="0 0 800 800"
      className={cn("pointer-events-none absolute inset-0 z-[2] h-full w-full", className)}
      aria-hidden
    >
      <QuizFaceSvg
        face={face}
        mouthStyle={mouthStyle}
        noJaw={noJaw}
        jawOpacity={jawOpacity}
        pureFace={pureFace}
      />
    </svg>
  );
}

export function QuizAvatar({
  id,
  size = "md",
  expression,
  className,
}: {
  id: string;
  size?: keyof typeof sizes;
  expression?: QuizFaceId;
  className?: string;
}) {
  const { body } = parseQuizAvatar(id);
  const BodyIcon = body ? SVG_ICONS[body] : null;

  return (
    <span
      className={cn("relative inline-flex shrink-0 overflow-hidden", sizes[size], className)}
      aria-hidden
    >
      {BodyIcon && <SvgLayer icon={BodyIcon} className="z-[1]" />}
      <FaceLayer id={id} expression={expression} />
    </span>
  );
}
