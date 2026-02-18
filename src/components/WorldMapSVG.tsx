// Faint SVG world map background
// Simplified continent outlines — fill and stroke use primary color at low opacity

export function WorldMapSVG() {
  return (
    <svg
      viewBox="0 0 1000 500"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      <g
        fill="hsl(var(--primary) / 0.04)"
        stroke="hsl(var(--primary) / 0.08)"
        strokeWidth="1"
      >
        {/* North America */}
        <path d="M 60 80 L 100 70 L 150 65 L 200 70 L 230 85 L 240 110 L 220 130 L 210 160 L 190 190 L 170 200 L 150 210 L 130 200 L 110 185 L 90 170 L 75 150 L 65 130 L 55 110 Z" />
        {/* Greenland */}
        <path d="M 220 30 L 260 25 L 290 35 L 295 55 L 280 70 L 255 75 L 230 65 L 215 50 Z" />
        {/* Central America */}
        <path d="M 170 200 L 190 195 L 205 215 L 195 230 L 175 225 L 165 210 Z" />
        {/* South America */}
        <path d="M 195 230 L 225 220 L 260 225 L 285 245 L 295 275 L 290 310 L 275 340 L 255 365 L 235 380 L 215 370 L 200 350 L 190 320 L 185 290 L 188 260 Z" />

        {/* Europe */}
        <path d="M 450 65 L 490 60 L 530 65 L 545 80 L 540 100 L 525 115 L 510 120 L 490 115 L 470 120 L 455 115 L 445 100 L 445 82 Z" />
        {/* Scandinavia */}
        <path d="M 490 30 L 510 25 L 530 35 L 535 55 L 520 65 L 500 62 L 485 50 Z" />
        {/* UK */}
        <path d="M 438 72 L 450 68 L 452 85 L 442 90 L 434 82 Z" />
        {/* Iberian Peninsula */}
        <path d="M 440 115 L 465 110 L 472 130 L 460 148 L 440 145 L 428 132 Z" />

        {/* Africa */}
        <path d="M 450 145 L 500 135 L 545 140 L 570 160 L 580 190 L 578 225 L 565 265 L 545 300 L 520 330 L 495 345 L 470 335 L 450 310 L 435 280 L 428 250 L 430 215 L 440 185 L 445 160 Z" />
        {/* Madagascar */}
        <path d="M 572 280 L 582 270 L 590 285 L 585 305 L 572 300 Z" />

        {/* Middle East / Arabian Peninsula */}
        <path d="M 560 120 L 600 115 L 625 130 L 630 155 L 615 170 L 590 175 L 565 165 L 552 148 Z" />

        {/* Central Asia */}
        <path d="M 580 80 L 640 70 L 690 75 L 720 90 L 715 115 L 690 125 L 650 125 L 610 118 L 580 105 Z" />

        {/* Russia / Siberia */}
        <path d="M 520 20 L 620 15 L 720 20 L 800 30 L 840 50 L 840 75 L 800 80 L 740 80 L 680 72 L 620 68 L 560 65 L 525 55 Z" />

        {/* South Asia */}
        <path d="M 630 125 L 680 120 L 720 130 L 735 150 L 725 175 L 700 190 L 670 188 L 648 175 L 635 155 Z" />
        {/* India */}
        <path d="M 660 175 L 695 175 L 700 205 L 680 225 L 660 215 L 648 195 Z" />
        {/* Sri Lanka */}
        <path d="M 695 228 L 702 222 L 708 230 L 702 238 Z" />

        {/* Southeast Asia */}
        <path d="M 720 145 L 760 138 L 790 148 L 798 168 L 782 185 L 755 190 L 730 182 L 718 165 Z" />
        {/* Malay Peninsula */}
        <path d="M 762 185 L 775 190 L 778 212 L 765 218 L 758 205 Z" />
        {/* Sumatra */}
        <path d="M 730 215 L 775 208 L 795 218 L 790 235 L 755 240 L 728 232 Z" />
        {/* Borneo */}
        <path d="M 790 200 L 825 195 L 840 210 L 835 235 L 810 245 L 788 235 L 782 215 Z" />
        {/* Java */}
        <path d="M 768 248 L 808 242 L 825 250 L 820 262 L 775 265 Z" />
        {/* Philippines */}
        <path d="M 808 165 L 825 155 L 838 168 L 828 185 L 808 182 Z" />

        {/* East Asia — China */}
        <path d="M 720 88 L 790 78 L 830 88 L 848 105 L 840 130 L 815 145 L 785 150 L 755 142 L 728 130 L 716 112 Z" />
        {/* Korean Peninsula */}
        <path d="M 835 95 L 852 90 L 862 105 L 852 120 L 838 118 Z" />
        {/* Japan */}
        <path d="M 858 88 L 878 80 L 892 90 L 890 108 L 872 115 L 856 106 Z" />
        {/* Taiwan */}
        <path d="M 845 142 L 856 138 L 862 148 L 855 158 L 844 152 Z" />

        {/* Australia */}
        <path d="M 790 300 L 850 285 L 900 295 L 930 315 L 935 345 L 920 375 L 890 390 L 850 395 L 815 385 L 790 360 L 778 330 Z" />
        {/* New Zealand */}
        <path d="M 940 360 L 955 350 L 965 362 L 960 378 L 945 375 Z" />
        {/* Tasmania */}
        <path d="M 875 400 L 890 395 L 895 408 L 882 413 Z" />

        {/* New Guinea */}
        <path d="M 835 255 L 878 248 L 900 258 L 898 275 L 870 280 L 840 272 Z" />

        {/* Iceland */}
        <path d="M 388 45 L 415 40 L 428 50 L 420 62 L 398 65 L 382 55 Z" />

        {/* Caribbean */}
        <path d="M 210 178 L 225 172 L 238 180 L 232 192 L 215 192 Z" />
      </g>
    </svg>
  );
}