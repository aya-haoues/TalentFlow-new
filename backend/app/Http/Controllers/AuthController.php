<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    // ✅ INSCRIPTION CANDIDAT : Publique, sans rôle à choisir
    public function registerCandidat(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-zA-Zàâçéèêëîïôûùüÿñæœ\s]+$/u'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/'],
            'telephone' => ['nullable', 'string', 'regex:/^(\+216|00216|0)?[23456789]\d{7}$/'],
            'linkedin_url' => ['nullable', 'url', 'regex:/^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_]{5,30}\/?$/'],
        ], $this->validationMessages());

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation échouée', 'errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => trim($request->name),
            'email' => strtolower(trim($request->email)),
            'password' => Hash::make($request->password),
            'role' => 'candidat', // 🔑 RÔLE FIXE
            'telephone' => $request->telephone,
            'linkedin_url' => $request->linkedin_url,
            'departement' => null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Inscription réussie ! Bienvenue sur Recrutech',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->only(['id', 'name', 'email', 'role', 'telephone', 'linkedin_url'])
        ], 201);
    }

    // ✅ INSCRIPTION RH : Département obligatoire + validation métier
    public function registerRh(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-zA-Zàâçéèêëîïôûùüÿñæœ\s]+$/u'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/'],
            'telephone' => ['required', 'string', 'regex:/^(\+216|00216|0)?[23456789]\d{7}$/'],
            'departement' => ['required', 'string', 'max:100', 'in:IT,Ventes,Marketing,RH,Finance,Production,Logistique'],
        ], $this->validationMessages());

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation échouée', 'errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => trim($request->name),
            'email' => strtolower(trim($request->email)),
            'password' => Hash::make($request->password),
            'role' => 'rh', // 🔑 RÔLE FIXE RH
            'telephone' => $request->telephone,
            'linkedin_url' => null,
            'departement' => $request->departement,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Inscription RH réussie ! Votre compte est en attente d\'approbation.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->only(['id', 'name', 'email', 'role', 'telephone', 'departement'])
        ], 201);
    }

    // ✅ INSCRIPTION MANAGER : Département + position obligatoires
    public function registerManager(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-zA-Zàâçéèêëîïôûùüÿñæœ\s]+$/u'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/'],
            'telephone' => ['required', 'string', 'regex:/^(\+216|00216|0)?[23456789]\d{7}$/'],
            'departement' => ['required', 'string', 'max:100', 'in:IT,Ventes,Marketing,RH,Finance,Production,Logistique'],
            'position' => ['required', 'string', 'max:100', 'in:Chef de département,Directeur,Responsable d\'équipe'],
        ], $this->validationMessages());

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation échouée', 'errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => trim($request->name),
            'email' => strtolower(trim($request->email)),
            'password' => Hash::make($request->password),
            'role' => 'manager', // 🔑 RÔLE FIXE MANAGER
            'telephone' => $request->telephone,
            'linkedin_url' => null,
            'departement' => $request->departement,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Inscription Manager réussie ! Votre compte est en attente d\'approbation.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->only(['id', 'name', 'email', 'role', 'telephone', 'departement'])
        ], 201);
    }

    // ✅ LOGIN UNIQUE (fonctionne pour tous les rôles)
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
        ], [
            'email.required' => 'Email obligatoire',
            'email.email' => 'Format invalide',
            'password.required' => 'Mot de passe obligatoire',
            'password.min' => '8 caractères minimum',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation échouée', 'errors' => $validator->errors()], 422);
        }

        $user = User::where('email', strtolower(trim($request->email)))->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Email ou mot de passe incorrect'], 401);
        }

        // 🔑 REDIRECTION SELON RÔLE STOCKÉ
        $redirectUrl = '/';
        if ($user->role === 'rh') $redirectUrl = '/dashboard/rh';
        elseif ($user->role === 'manager') $redirectUrl = '/dashboard/manager';

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->only(['id', 'name', 'email', 'role', 'telephone', 'departement', 'linkedin_url']),
            'redirect_url' => $redirectUrl
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Déconnexion réussie']);
    }

    // Messages de validation réutilisables
    private function validationMessages(): array
    {
        return [
            'name.required' => 'Le nom est obligatoire',
            'name.min' => 'Minimum 2 caractères',
            'name.regex' => 'Lettres uniquement',
            'email.required' => 'Email obligatoire',
            'email.email' => 'Format invalide',
            'email.unique' => 'Email déjà utilisé',
            'password.required' => 'Mot de passe obligatoire',
            'password.min' => '8 caractères minimum',
            'password.confirmed' => 'Mots de passe non identiques',
            'password.regex' => '1 maj, 1 min, 1 chiffre',
            'telephone.required' => 'Téléphone obligatoire pour les RH/Managers',
            'telephone.regex' => 'Format tunisien (+216 ...)',
            'departement.required' => 'Département obligatoire',
            'departement.in' => 'Département invalide',
            'position.required' => 'Position hiérarchique obligatoire',
            'position.in' => 'Position invalide',
            'linkedin_url.regex' => 'URL LinkedIn invalide',
        ];
    }
}