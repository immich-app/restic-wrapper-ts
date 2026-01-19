{
  pkgs ? import <nixpkgs> { },
}:

with pkgs;
pkgs.mkShell {
  buildInputs = [
    restic
    zizmor
    nodejs
    nodejs.pkgs.pnpm
  ];
}
