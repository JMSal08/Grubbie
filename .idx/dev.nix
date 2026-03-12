# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{pkgs}: {
  # Which nixpkgs channel to use.
  channel = "stable-24.11"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.zulu
  ];
  # Sets environment variables in the workspace
  env = {
    NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSyB7WgP4NXC5Bw-ZNYr0tk_FmrpGXRC3R-I";
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "studio-3971839089-f3478.firebaseapp.com";
    NEXT_PUBLIC_FIREBASE_PROJECT_ID = "studio-3971839089-f3478";
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "studio-3971839089-f3478.firebasestorage.app";
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "900353647370";
    NEXT_PUBLIC_FIREBASE_APP_ID = "1:900353647370:web:d6ae8f598c085c73d750f3";
  };
  # This adds a file watcher to startup the firebase emulators. The emulators will only start if
  # a firebase.json file is written into the user's directory
  services.firebase.emulators = {
    # Disabling because we are using prod backends right now
    detect = false;
    projectId = "demo-app";
    services = ["auth" "firestore"];
  };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];
    workspace = {
      onCreate = {
        default.openFiles = [
          "src/app/page.tsx"
        ];
      };
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
