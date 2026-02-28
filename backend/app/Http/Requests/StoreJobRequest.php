<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreJobRequest extends FormRequest
{
    /**
     * Autorisation de la requête
     */
    public function authorize(): bool
    {
        // Ici on pourrait vérifier le rôle,
        // mais comme la route est déjà protégée par
        // middleware auth:sanctum + role:rh
        // on retourne simplement true.
        return true;
    }

    /**
     * Règles de validation
     */
    public function rules(): array
    {
        return [
            'titre' => 'required|string|max:255',

            'department_id' => 'required|exists:departments,id',

            'type_contrat' => 'required|in:CDI,CDD,Stage,Alternance,Freelance',

            'niveau_experience' => 'required|in:junior,confirme,senior',

            'type_lieu' => 'required|in:remote,hybrid,onsite',

            'description' => 'required|string|min:20',

            'competences_requises' => 'required|array|min:1',

            'competences_requises.*' => 'string|max:100',

            'nombre_postes' => 'required|integer|min:1',

            'date_limite' => 'nullable|date|after:today',

            'salaire_min' => 'nullable|integer|min:0',

            'salaire_max' => 'nullable|integer|gte:salaire_min'
        ];
    }

    /**
     * Messages personnalisés (optionnel mais professionnel)
     */
    public function messages(): array
    {
        return [
            'department_id.exists' => 'Le département sélectionné est invalide.',
            'date_limite.after' => 'La date limite doit être après aujourd’hui.',
            'salaire_max.gte' => 'Le salaire maximum doit être supérieur ou égal au salaire minimum.',
            'competences_requises.required' => 'Au moins une compétence est requise.',
        ];
    }

    /**
     * Nettoyage des données avant validation (important)
     */
    protected function prepareForValidation()
    {
        // Si jamais le frontend envoie les compétences
        // sous forme de string séparée par virgule
        // on les transforme en array

        if (is_string($this->competences_requises)) {
            $this->merge([
                'competences_requises' => array_map('trim', explode(',', $this->competences_requises))
            ]);
        }
    }
}