import Image from 'next/image';

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <div className="relative w-full max-w-[800px] aspect-[2/1]">
        <Image
          src="/banner-macros-transparent.png"
          alt="Macros - Social Nutrition Tracker"
          fill
          priority
          className="object-contain"
        />
      </div>
      <h1 className="sr-only">Macros - Social Nutrition Tracker</h1>
      <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        Track your nutrition and share your journey with{" "}
        <span className="font-bold">Macros</span>
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
