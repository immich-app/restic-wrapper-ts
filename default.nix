{ pkgs ? import (fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/a07d4ce6bee67d7c838a8a5796e75dff9caa21ef.tar.gz";
    sha256 = "0f6zni3jn6ji5icwbidbpmcgxdal2qnjszp7ragdcy0857hvq3c5";
  }) {},
}:

pkgs.mkShell {
  packages = with pkgs; [
    mise
    (writeShellScriptBin "fish" ''
      exec ${pkgs.fish}/bin/fish -C 'mise activate fish | source' "$@"
    '')
  ];
}