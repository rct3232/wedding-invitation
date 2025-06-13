import Image from "next/image";

const HeaderImage = ({ header }) => {
  return (
    <Image
      src={`data:image/jpeg;base64,${header}`}
      alt="Header picture"
      fill
      objectFit="cover"
      objectPosition="center"
    />
  );
};

export default HeaderImage;