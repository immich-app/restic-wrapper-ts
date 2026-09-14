{ pkgs ? import (fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/e8be7818e19ada32105a8af937a6a473b38167ca.tar.gz";
    sha256 = "06sil8mb0psrx1x49yfrxxr7sd6fqjz77amyx7bhr7rp3216gpyh";
  }) {},
}:

let
  nix-ld-libs = pkgs.buildEnv {
    name = "nix-ld-libs";
    paths = with pkgs; [
      stdenv.cc.cc.lib
      zlib
      openssl
    ];
  };

in pkgs.mkShell {
  packages = with pkgs; [
    mise
    lsof
    pkg-config
    openssl.dev
    python3
    (writeShellScriptBin "fish" ''
      exec ${pkgs.fish}/bin/fish -C '${pkgs.mise}/bin/mise activate fish | source' "$@"
    '')
  ];

  shellHook = ''
    export NIX_LD="${pkgs.stdenv.cc.libc}/lib/ld-linux-x86-64.so.2"
    export NIX_LD_LIBRARY_PATH="${nix-ld-libs}/lib"

    eval "$(${pkgs.mise}/bin/mise activate bash)"
  '';
}
