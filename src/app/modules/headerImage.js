import Image from "next/image";

const HeaderImage = ({ header }) => {
  return (
    <Image
      src={header}
      alt="Header picture"
      fill
      objectFit="cover"
      objectPosition="center"
    />
  );
};

export default HeaderImage;