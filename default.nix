{
  pkgs ? import <nixpkgs> { },
}:

with pkgs;
pkgs.mkShell {
  buildInputs = [
    restic
    nodejs
    nodejs.pkgs.pnpm
  ];
}
